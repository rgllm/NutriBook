class City < ApplicationRecord
  has_many :services, foreign_key: :city, primary_key: :name, inverse_of: false, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true

  # The city of the located service nearest the point.
  def self.nearest_to(origin)
    nearest = Service.where.not(latitude: nil).order(Arel.sql(origin.distance_km_sql("services"))).limit(1)
    where(name: nearest.select(:city))
  end
end
