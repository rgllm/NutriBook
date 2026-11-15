class AddRejectionReasonAndAnswerNotifiedAtToAppointmentRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :appointment_requests, :rejection_reason, :string
    add_column :appointment_requests, :answer_notified_at, :datetime

    # Requests rejected before this column existed were answered by hand.
    reversible do |direction|
      direction.up { execute "UPDATE appointment_requests SET rejection_reason = 'declined' WHERE status = 'rejected'" }
    end

    add_check_constraint :appointment_requests, "rejection_reason IN ('declined', 'overlap')",
      name: "appointment_requests_rejection_reason_allowed"
    add_check_constraint :appointment_requests, "(rejection_reason IS NOT NULL) = (status = 'rejected')",
      name: "appointment_requests_rejection_reason_matches_status"
    add_check_constraint :appointment_requests, "answer_notified_at IS NULL OR answered_at IS NOT NULL",
      name: "appointment_requests_notified_only_when_answered"
  end
end
