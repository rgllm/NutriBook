# A point on Earth, such as the guest's position.
class Coordinates < Data.define(:latitude, :longitude)
  EARTH_DIAMETER_KM = 12_742

  # The point, or nil when either value is missing, not a number, or off the globe.
  def self.parse(latitude, longitude)
    latitude = Float(latitude, exception: false)
    longitude = Float(longitude, exception: false)
    new(latitude:, longitude:) if latitude&.between?(-90, 90) && longitude&.between?(-180, 180)
  end

  # SQL for the great-circle distance in kilometres from this point to the
  # table's latitude and longitude columns, or NULL where they are unknown.
  def distance_km_sql(table)
    ActiveRecord::Base.sanitize_sql_array([ <<~SQL.squish, latitude, latitude, longitude ])
      #{EARTH_DIAMETER_KM} * asin(sqrt(
        power(sin(radians(#{table}.latitude - ?) / 2), 2)
        + cos(radians(?)) * cos(radians(#{table}.latitude)) * power(sin(radians(#{table}.longitude - ?) / 2), 2)))
    SQL
  end
end
