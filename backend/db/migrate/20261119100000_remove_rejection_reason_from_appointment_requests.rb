# Nothing reads the reason: the rejected email reads the same either way.
class RemoveRejectionReasonFromAppointmentRequests < ActiveRecord::Migration[8.1]
  def up
    remove_check_constraint :appointment_requests, name: "appointment_requests_rejection_reason_matches_status"
    remove_check_constraint :appointment_requests, name: "appointment_requests_rejection_reason_allowed"
    remove_column :appointment_requests, :rejection_reason
  end

  # Overlap rejections cannot be told apart once the column is gone, so every
  # rejected request comes back as declined.
  def down
    add_column :appointment_requests, :rejection_reason, :string
    execute "UPDATE appointment_requests SET rejection_reason = 'declined' WHERE status = 'rejected'"
    add_check_constraint :appointment_requests, "rejection_reason IN ('declined', 'overlap')",
      name: "appointment_requests_rejection_reason_allowed"
    add_check_constraint :appointment_requests, "(rejection_reason IS NOT NULL) = (status = 'rejected')",
      name: "appointment_requests_rejection_reason_matches_status"
  end
end
