class CreateServices < ActiveRecord::Migration[8.1]
  def change
    create_table :services do |t|
      t.references :nutritionist, null: false, foreign_key: true, index: false
      t.string :name, null: false
      t.decimal :price, precision: 8, scale: 2, null: false
      t.string :location, null: false
      t.string :address, null: false
      t.integer :duration_minutes, null: false

      t.timestamps

      # Target of the composite foreign key on appointment_requests. Its leading
      # column also serves lookups by nutritionist, so no separate index is needed.
      t.index [ :nutritionist_id, :id ], unique: true
      t.index [ :location, :nutritionist_id ]
      t.check_constraint "price >= 0", name: "services_price_not_negative"
      t.check_constraint "duration_minutes > 0", name: "services_duration_positive"
    end
  end
end
