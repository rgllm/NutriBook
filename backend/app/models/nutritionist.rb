class Nutritionist < ApplicationRecord
  TITLES = %w[Dietitian Nutritionist].freeze

  has_many :services, dependent: :restrict_with_error
  has_many :appointment_requests, dependent: :restrict_with_error
  # Accepted appointments that have not ended yet, which new bookings must avoid.
  has_many :upcoming_appointments, -> { accepted.where("ends_at > ?", Time.current) }, class_name: "AppointmentRequest"

  validates :name, :license_number, presence: true
  validates :license_number, uniqueness: true
  validates :title, inclusion: { in: TITLES }
end
