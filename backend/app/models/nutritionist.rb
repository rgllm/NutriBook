class Nutritionist < ApplicationRecord
  TITLES = %w[Dietitian Nutritionist].freeze

  has_many :services, dependent: :restrict_with_error
  has_many :appointment_requests, dependent: :restrict_with_error

  validates :name, :license_number, presence: true
  validates :license_number, uniqueness: true
  validates :title, inclusion: { in: TITLES }
end
