class MoveAddressToServices < ActiveRecord::Migration[8.1]
  def up
    rename_column :services, :location, :city
    add_column :services, :street_address, :string

    execute <<~SQL
      UPDATE services
      SET street_address = nutritionists.address
      FROM nutritionists
      WHERE nutritionists.id = services.nutritionist_id
    SQL

    change_column_null :services, :street_address, false
    remove_column :nutritionists, :address
  end

  def down
    add_column :nutritionists, :address, :string

    execute <<~SQL
      UPDATE nutritionists
      SET address = first_service.street_address
      FROM (
        SELECT DISTINCT ON (nutritionist_id) nutritionist_id, street_address
        FROM services
        ORDER BY nutritionist_id, id
      ) AS first_service
      WHERE first_service.nutritionist_id = nutritionists.id
    SQL

    change_column_null :nutritionists, :address, false
    remove_column :services, :street_address
    rename_column :services, :city, :location
  end
end
