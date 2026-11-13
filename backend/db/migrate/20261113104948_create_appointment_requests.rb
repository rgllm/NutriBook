class CreateAppointmentRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :appointment_requests do |t|
      t.references :service, null: false, foreign_key: true
      t.references :nutritionist, null: false, foreign_key: true
      t.string :guest_name
      t.string :guest_email
      t.datetime :starts_at
      t.datetime :ends_at
      t.string :status

      t.timestamps
    end
  end
end
