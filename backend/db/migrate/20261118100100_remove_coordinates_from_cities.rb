class RemoveCoordinatesFromCities < ActiveRecord::Migration[8.1]
  # City centres only served the nearest-city lookup, which distance search
  # from the services' own coordinates replaces.
  def change
    remove_check_constraint :cities, "latitude BETWEEN -90 AND 90", name: "cities_latitude_in_range"
    remove_check_constraint :cities, "longitude BETWEEN -180 AND 180", name: "cities_longitude_in_range"
    remove_column :cities, :latitude, :decimal, precision: 8, scale: 6, null: false
    remove_column :cities, :longitude, :decimal, precision: 9, scale: 6, null: false
  end
end
