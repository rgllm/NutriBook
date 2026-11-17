class AddCoordinatesToServices < ActiveRecord::Migration[8.1]
  # Where the service is given. Both are unknown until the address is geocoded,
  # and such services sort after the ones with a distance.
  def change
    add_column :services, :latitude, :decimal, precision: 8, scale: 6
    add_column :services, :longitude, :decimal, precision: 9, scale: 6

    add_check_constraint :services, "latitude BETWEEN -90 AND 90", name: "services_latitude_in_range"
    add_check_constraint :services, "longitude BETWEEN -180 AND 180", name: "services_longitude_in_range"
    add_check_constraint :services, "(latitude IS NULL) = (longitude IS NULL)", name: "services_coordinates_paired"
  end
end
