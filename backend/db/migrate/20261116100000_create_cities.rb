class CreateCities < ActiveRecord::Migration[8.1]
  # City centres for the cities the demo seeds created before this table
  # existed, so their services keep a valid foreign key.
  SEEDED_CITIES = {
    "Aveiro" => [ 40.640500, -8.653800 ],
    "Braga" => [ 41.545400, -8.426500 ],
    "Coimbra" => [ 40.203300, -8.410300 ],
    "Faro" => [ 37.019400, -7.932200 ],
    "Guimarães" => [ 41.442500, -8.291800 ],
    "Leiria" => [ 39.743600, -8.807100 ],
    "Lisboa" => [ 38.722300, -9.139300 ],
    "Porto" => [ 41.157900, -8.629100 ],
    "Viana do Castelo" => [ 41.693200, -8.832900 ]
  }.freeze

  def up
    create_table :cities do |t|
      t.string :name, null: false, index: { unique: true }
      t.decimal :latitude, precision: 8, scale: 6, null: false
      t.decimal :longitude, precision: 9, scale: 6, null: false

      t.timestamps

      t.check_constraint "latitude BETWEEN -90 AND 90", name: "cities_latitude_in_range"
      t.check_constraint "longitude BETWEEN -180 AND 180", name: "cities_longitude_in_range"
    end

    cities = select_values("SELECT DISTINCT city FROM services")
    unknown = cities - SEEDED_CITIES.keys
    if unknown.any?
      raise ActiveRecord::MigrationError, "No coordinates for #{unknown.to_sentence}. Add them to SEEDED_CITIES or reseed."
    end

    cities.each do |name|
      latitude, longitude = SEEDED_CITIES.fetch(name)
      execute <<~SQL
        INSERT INTO cities (name, latitude, longitude, created_at, updated_at)
        VALUES (#{quote(name)}, #{latitude}, #{longitude}, now(), now())
      SQL
    end

    # The existing index on services (city, nutritionist_id) covers this key.
    add_foreign_key :services, :cities, column: :city, primary_key: :name
  end

  def down
    remove_foreign_key :services, :cities, column: :city
    drop_table :cities
  end
end
