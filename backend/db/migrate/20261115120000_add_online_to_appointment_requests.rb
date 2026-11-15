class AddOnlineToAppointmentRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :appointment_requests, :online, :boolean, null: false, default: false
  end
end
