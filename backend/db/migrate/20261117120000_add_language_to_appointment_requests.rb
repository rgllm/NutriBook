class AddLanguageToAppointmentRequests < ActiveRecord::Migration[8.1]
  def change
    # Requests booked before this column existed were answered in English.
    add_column :appointment_requests, :language, :string, null: false, default: "en-GB"

    add_check_constraint :appointment_requests, "language IN ('en-GB', 'pt-PT')",
      name: "appointment_requests_language_allowed"
  end
end
