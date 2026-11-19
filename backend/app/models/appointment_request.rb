class AppointmentRequest < ApplicationRecord
  ANSWERS = %w[accepted rejected].freeze
  GUEST_NAME_MAX_LENGTH = 100
  # The longest address SMTP can deliver to (RFC 5321).
  GUEST_EMAIL_MAX_LENGTH = 254
  # URI::MailTo::EMAIL_REGEXP accepts a domain without a dot, like user@com,
  # which no guest can receive mail at. The lookahead requires one.
  GUEST_EMAIL_FORMAT = /(?=[^@]*@[^@]+\.)#{URI::MailTo::EMAIL_REGEXP}/
  # The languages answer emails are written in. The first is the fallback.
  LANGUAGES = %w[en-GB pt-PT].freeze

  # The request can no longer take the answer. The message is a code for why:
  # it was already_accepted, already_rejected, or superseded, accepting it
  # overlaps_accepted an appointment, or it overlaps_changed: accepting would
  # reject a request the nutritionist was not shown.
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

  # Half-open intervals, like the exclusion constraint's tsrange: an
  # appointment ending at 11:00 does not overlap one starting at 11:00. The
  # bounds may be times or another table's columns.
  scope :overlapping, ->(starts_at, ends_at) {
    where(arel_table[:starts_at].lt(ends_at).and(arel_table[:ends_at].gt(starts_at)))
  }

  normalizes :guest_email, with: ->(email) { email.strip.downcase }
  normalizes :guest_name, with: ->(name) { name.squish }
  normalizes :language, with: ->(tag) { supported_language(tag) }, apply_to_nil: true

  # Only on create: a saved request keeps the interval it was booked with.
  before_validation :derive_from_service, on: :create, if: -> { service && starts_at }

  validates :guest_name, presence: true, length: { maximum: GUEST_NAME_MAX_LENGTH }
  validates :guest_email, presence: true, length: { maximum: GUEST_EMAIL_MAX_LENGTH }
  validates :guest_email, format: { with: GUEST_EMAIL_FORMAT }, allow_blank: true
  validates :starts_at, presence: true
  validate :online_offered
  validate :bookable_time, on: :create

  # The language the guest booked in, which their answer email uses. Another
  # variant of a supported language, like pt-BR, gets that language, and
  # anything else gets English, so a booking never fails over its email.
  def self.supported_language(tag)
    primary = ->(language) { language.to_s.split("-").first.to_s.downcase }

    LANGUAGES.find { |language| language.casecmp?(tag.to_s) } ||
      LANGUAGES.find { |language| primary.(language) == primary.(tag) } ||
      LANGUAGES.first
  end

  # Saves a new request in place of the guest's pending one. The advisory lock
  # serialises submissions from the same email, so the newest always wins and
  # the one-pending-per-guest index is never hit by a race. The pending request
  # is matched on lower(guest_email), the expression that index uses, so the
  # lookup is indexed and finds every row the index would conflict with.
  #
  # The nutritionist's FOR SHARE lock waits for an answer in flight and holds
  # off new answers until this commits, so a request is either checked against
  # an accepted appointment or rejected by its acceptance. Submissions don't
  # block each other. It comes before superseding: an accept that holds the
  # nutritionist may be waiting to reject the guest's pending request.
  def self.submit(attributes)
    request = new(attributes)
    transaction do
      connection.execute(sanitize_sql([ "SELECT pg_advisory_xact_lock(hashtext(?))", request.guest_email.to_s ]))
      Nutritionist.lock("FOR SHARE").find_by(id: request.service.nutritionist_id) if request.service
      pending.where("lower(guest_email) = ?", request.guest_email).update_all(status: "superseded", updated_at: Time.current)
      raise ActiveRecord::Rollback unless request.save
    end
    request
  end

  # For each of the given pending requests, the ids of the others among them
  # that accepting it would reject, soonest first. Requests that overlap
  # nothing are left out. Limited to the given requests so the answer matches
  # the list the nutritionist is shown.
  def self.overlapping_ids_among(requests)
    accepting = arel_table.alias("accepting")
    ids = requests.map(&:id)

    where(id: ids)
      .joins(arel_table.join(accepting).on(
        accepting[:nutritionist_id].eq(arel_table[:nutritionist_id]).and(accepting[:id].not_eq(arel_table[:id]))
      ).join_sources)
      .where(accepting[:id].in(ids))
      .overlapping(accepting[:starts_at], accepting[:ends_at])
      .order(:starts_at, :id)
      .pluck(accepting[:id], :id)
      .group_by(&:first).transform_values { |pairs| pairs.map(&:last) }
  end

  # Accepts or rejects this request. Accepting also rejects the nutritionist's
  # pending requests that overlap it, and returns their ids.
  #
  # overlapping_ids are the overlapping requests the nutritionist was shown.
  # When given, accepting refuses to reject any other, so a request that
  # arrived after the list loaded is never rejected unseen. Fewer is fine: a
  # shown request that has since left the pending list is simply not rejected.
  #
  # The nutritionist's row lock makes their answers run one at a time, and run
  # apart from submissions to them, which hold it FOR SHARE.
  #
  # Every request answered here gets one email job, enqueued inside this
  # transaction on purpose: Solid Queue shares the database, so the jobs commit
  # or roll back with the answers they announce.
  def answer!(answer, overlapping_ids: nil)
    unless answer.in?(ANSWERS)
      errors.add(:status, :not_an_answer)
      raise ActiveRecord::RecordInvalid, self
    end

    transaction do
      Nutritionist.lock("FOR NO KEY UPDATE").find(nutritionist_id)
      lock!
      raise NotAnswerable, (superseded? ? "superseded" : "already_#{status}") unless pending?

      accepting = answer == "accepted"
      raise NotAnswerable, "overlaps_accepted" if accepting && overlaps_accepted?

      rejected_ids = accepting ? pending_overlaps.lock.pluck(:id) : []
      raise NotAnswerable, "overlaps_changed" if overlapping_ids && (rejected_ids - overlapping_ids).any?

      now = Time.current
      update!(status: answer, answered_at: now)
      AppointmentRequest.where(id: rejected_ids).update_all(status: "rejected", answered_at: now, updated_at: now)

      ActiveJob.perform_all_later([ id, *rejected_ids ].map { |answered_id| AppointmentAnswerEmailJob.new(answered_id) })
      rejected_ids
    end
  end

  private

  def pending_overlaps
    AppointmentRequest.pending.where(nutritionist_id:).where.not(id:).overlapping(starts_at, ends_at)
  end

  # Rails derives the nutritionist and booked end time from the service, never
  # the client. The composite foreign key enforces nutritionist/service
  # consistency, not the duration calculation.
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
