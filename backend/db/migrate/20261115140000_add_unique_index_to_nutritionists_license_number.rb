class AddUniqueIndexToNutritionistsLicenseNumber < ActiveRecord::Migration[8.1]
  def change
    add_index :nutritionists, :license_number, unique: true
  end
end
