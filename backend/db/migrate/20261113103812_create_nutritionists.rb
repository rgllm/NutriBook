class CreateNutritionists < ActiveRecord::Migration[8.1]
  def change
    create_table :nutritionists do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :title, null: false
      t.string :license_number, null: false
      t.boolean :offers_online, null: false, default: false

      t.timestamps

      t.index :slug, unique: true
      t.check_constraint "title IN ('Dietitian', 'Nutritionist')", name: "nutritionists_title_allowed"    end
  end
end
