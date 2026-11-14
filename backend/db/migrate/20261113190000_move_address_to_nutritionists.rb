class MoveAddressToNutritionists < ActiveRecord::Migration[8.1]
  def up
    add_column :nutritionists, :address, :string

    execute <<~SQL
      UPDATE nutritionists
      SET address = first_service.address
      FROM (
        SELECT DISTINCT ON (nutritionist_id) nutritionist_id, address
        FROM services
        ORDER BY nutritionist_id, id
      ) AS first_service
      WHERE first_service.nutritionist_id = nutritionists.id
    SQL

    change_column_null :nutritionists, :address, false
    remove_column :services, :address
  end

  def down
    add_column :services, :address, :string

    execute <<~SQL
      UPDATE services
      SET address = nutritionists.address
      FROM nutritionists
      WHERE nutritionists.id = services.nutritionist_id
    SQL

    change_column_null :services, :address, false
    remove_column :nutritionists, :address
  end
end
