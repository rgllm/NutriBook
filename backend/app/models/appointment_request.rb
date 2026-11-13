class AppointmentRequest < ApplicationRecord
  belongs_to :service
  belongs_to :nutritionist

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
  validates :guest_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :starts_at, presence: true

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
end
