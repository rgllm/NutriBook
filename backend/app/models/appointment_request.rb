class AppointmentRequest < ApplicationRecord
  belongs_to :service
  # Derived from the service, so a missing service reports only on :service.
  belongs_to :nutritionist, optional: true

  enum :status, {
    pending: "pending",
    accepted: "accepted",
    rejected: "rejected",
    superseded: "superseded"
  }, validate: true

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

  private

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
    AppointmentRequest.accepted
      .where(nutritionist_id:)
      .where("starts_at < ? AND ends_at > ?", ends_at, starts_at)
      .exists?
  end
end
