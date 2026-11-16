class LimitAppointmentRequestGuestLengths < ActiveRecord::Migration[8.1]
  def change
    add_check_constraint :appointment_requests, "char_length(guest_name) <= 100",
      name: "appointment_requests_guest_name_length"
    add_check_constraint :appointment_requests, "char_length(guest_email) <= 254",
      name: "appointment_requests_guest_email_length"
  end
end
