class AppointmentRequest < ApplicationRecord
  ANSWERS = %w[accepted rejected].freeze

  # The request can no longer take the answer: it was answered or superseded,
  # or accepting it would overlap an accepted appointment.
  class NotAnswerable < StandardError; end

  belongs_to :service
  # Derived from the service, so a missing service reports only on :service.
  belongs_to :nutritionist, optional: true

  enum :status, {
    pending: "pending",
    accepted: "accepted",
    rejected: "rejected",
    superseded: "superseded"
  }, validate: true

  # Why a rejected request was rejected: the nutritionist declined it, or it
  # overlapped a request they accepted. Set only on rejected requests.
  enum :rejection_reason, { declined: "declined", overlap: "overlap" }, prefix: :rejection

  scope :overlapping, ->(starts_at, ends_at) { where("starts_at < ? AND ends_at > ?", ends_at, starts_at) }

  normalizes :guest_email, with: ->(email) { email.strip.downcase }
  normalizes :guest_name, with: ->(name) { name.squish }

  before_validation :derive_from_service, if: :booking_changed?

  validates :guest_name, presence: true
  validates :guest_email, presence: true
  validates :guest_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :starts_at, presence: true
  validate :online_offered
  validate :bookable_time, on: :create

  # Saves a new request in place of the guest's pending one. The advisory lock
  # serialises submissions from the same email, so the newest always wins and
  # the one-pending-per-guest index is never hit by a race.
  def self.submit(attributes)
    request = new(attributes)
    transaction do
      connection.execute(sanitize_sql([ "SELECT pg_advisory_xact_lock(hashtext(?))", request.guest_email.to_s ]))
      pending.where(guest_email: request.guest_email).update_all(status: "superseded", updated_at: Time.current)
      raise ActiveRecord::Rollback unless request.save
    end
    request
  end

  # Accepts or rejects this request. Accepting also rejects the nutritionist's
  # pending requests that overlap it, and returns their ids.
  #
  # The nutritionist's row lock makes their answers run one at a time. It is
  # FOR NO KEY UPDATE so guests can still insert requests that reference the
  # nutritionist, which FOR UPDATE would block.
  #
  # Every request answered here gets one email job, enqueued inside this
  # transaction on purpose: Solid Queue shares the database, so the jobs commit
  # or roll back with the answers they announce.
  def answer!(answer)
    unless answer.in?(ANSWERS)
      errors.add(:status, :not_an_answer)
      raise ActiveRecord::RecordInvalid, self
    end

    transaction do
      Nutritionist.lock("FOR NO KEY UPDATE").find(nutritionist_id)
      lock!
      raise NotAnswerable, I18n.t(status, scope: "appointment_request.not_answerable") unless pending?

      accepting = answer == "accepted"
      raise NotAnswerable, I18n.t("booked", scope: "appointment_request.not_answerable") if accepting && overlaps_accepted?

      now = Time.current
      update!(status: answer, answered_at: now, rejection_reason: ("declined" unless accepting))
      rejected_ids = accepting ? reject_overlapping(now) : []

      ActiveJob.perform_all_later([ id, *rejected_ids ].map { |answered_id| AppointmentAnswerEmailJob.new(answered_id) })
      rejected_ids
    end
  end

  private

  def reject_overlapping(now)
    overlapping = AppointmentRequest.pending.where(nutritionist_id:).overlapping(starts_at, ends_at)
    overlapping.lock.pluck(:id).tap do |ids|
      AppointmentRequest.where(id: ids).update_all(status: "rejected", rejection_reason: "overlap", answered_at: now, updated_at: now)
    end
  end

  # Derive only when the booking itself is new or changes. A saved request keeps
  # the interval it was booked with, even if the service's duration is edited
  # later, so answering or editing it never moves the appointment.
  def booking_changed?
    service && starts_at &&
      (new_record? || will_save_change_to_service_id? || will_save_change_to_starts_at?)
  end

  # The nutritionist and end time always follow the chosen service, never the
  # client. The composite foreign key enforces the same rule in the database.
  def derive_from_service
    self.nutritionist = service.nutritionist
    self.ends_at = starts_at + service.duration_minutes.minutes
  end

  def online_offered
    errors.add(:online, :not_offered) if online? && nutritionist && !nutritionist.offers_online?
  end

  def bookable_time
    return if starts_at.blank?

    if starts_at <= Time.current
      errors.add(:starts_at, :past)
    elsif !BookingSchedule.slot?(starts_at)
      errors.add(:starts_at, :not_a_slot)
    elsif ends_at && overlaps_accepted?
      errors.add(:starts_at, :taken)
    end
  end

  def overlaps_accepted?
    AppointmentRequest.accepted.where(nutritionist_id:).overlapping(starts_at, ends_at).exists?
  end
end
