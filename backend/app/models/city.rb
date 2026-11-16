class City < ApplicationRecord
  has_many :services, foreign_key: :city, primary_key: :name, inverse_of: false, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validates :latitude, numericality: { in: -90..90 }
  validates :longitude, numericality: { in: -180..180 }

  # Cities with at least one service, nearest first by great-circle distance.
  # Ordering by the haversine term alone is enough: distance grows with it.
  def self.nearest_to(latitude:, longitude:)
    where(name: Service.select(:city)).order(Arel.sql(sanitize_sql_array([ <<~SQL.squish, latitude, latitude, longitude ])), :name)
      power(sin(radians(latitude - ?) / 2), 2)
      + cos(radians(?)) * cos(radians(latitude)) * power(sin(radians(longitude - ?) / 2), 2)
    SQL
  end
end
