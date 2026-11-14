class Service < ApplicationRecord
  belongs_to :nutritionist
  has_many :appointment_requests, dependent: :restrict_with_error

  validates :name, :location, presence: true
  validates :price, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_minutes, numericality: { only_integer: true, greater_than: 0 }

  def self.locations
    distinct.order(:location).pluck(:location)
  end
end
