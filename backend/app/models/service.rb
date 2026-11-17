class Service < ApplicationRecord
  belongs_to :nutritionist
  has_many :appointment_requests, dependent: :restrict_with_error

  validates :name, :city, :street_address, presence: true
  validates :price, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_minutes, numericality: { only_integer: true, greater_than: 0 }
  validates :latitude, numericality: { in: -90..90 }, allow_nil: true
  validates :longitude, numericality: { in: -180..180 }, allow_nil: true
  validates :latitude, presence: true, if: :longitude
  validates :longitude, presence: true, if: :latitude

  def self.cities
    distinct.order(:city).pluck(:city)
  end
end
