class CreateNutritionists < ActiveRecord::Migration[8.1]
  def change
    create_table :nutritionists do |t|
      t.string :name
      t.string :slug
      t.string :title
      t.string :license_number

      t.timestamps
    end
  end
end
