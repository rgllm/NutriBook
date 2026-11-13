class CreateServices < ActiveRecord::Migration[8.1]
  def change
    create_table :services do |t|
      t.references :nutritionist, null: false, foreign_key: true
      t.string :name
      t.decimal :price, precision: 8, scale: 2
      t.string :location
      t.integer :duration_minutes

      t.timestamps
    end
  end
end
