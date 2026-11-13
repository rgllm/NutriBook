class MoveCityAndAddressToNutritionists < ActiveRecord::Migration[8.1]
  def up
    add_column :nutritionists, :city, :string
    add_column :nutritionists, :address, :string

    execute <<~SQL
      UPDATE nutritionists
      SET city = first_service.location, address = first_service.address
      FROM (
        SELECT DISTINCT ON (nutritionist_id) nutritionist_id, location, address
        FROM services
        ORDER BY nutritionist_id, id
      ) AS first_service
      WHERE first_service.nutritionist_id = nutritionists.id
    SQL

    change_column_null :nutritionists, :city, false
    change_column_null :nutritionists, :address, false
    add_index :nutritionists, [ :city, :name ]

    remove_index :services, [ :location, :nutritionist_id ]
    remove_column :services, :location
    remove_column :services, :address
  end

  def down
    add_column :services, :location, :string
    add_column :services, :address, :string

    execute <<~SQL
      UPDATE services
      SET location = nutritionists.city, address = nutritionists.address
      FROM nutritionists
      WHERE nutritionists.id = services.nutritionist_id
    SQL

    change_column_null :services, :location, false
    change_column_null :services, :address, false
    add_index :services, [ :location, :nutritionist_id ]

    remove_index :nutritionists, [ :city, :name ]
    remove_column :nutritionists, :city
    remove_column :nutritionists, :address
  end
end
