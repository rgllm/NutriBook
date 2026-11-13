class CreateAppointmentRequests < ActiveRecord::Migration[8.1]
  def change
    enable_extension "btree_gist"

    create_table :appointment_requests do |t|
      t.references :service, null: false
      t.references :nutritionist, null: false, foreign_key: true, index: false
      t.string :guest_name, null: false
      t.string :guest_email, null: false
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :answered_at

      t.timestamps

      # The service must belong to the nutritionist the request is sent to.
      t.foreign_key :services, column: [ :nutritionist_id, :service_id ], primary_key: [ :nutritionist_id, :id ]

      t.check_constraint "status IN ('pending', 'accepted', 'rejected', 'superseded')",
        name: "appointment_requests_status_allowed"
      t.check_constraint "ends_at > starts_at", name: "appointment_requests_ends_after_starts"
      t.check_constraint "(answered_at IS NOT NULL) = (status IN ('accepted', 'rejected'))",
        name: "appointment_requests_answered_at_matches_status"

      t.index "lower(guest_email)", unique: true, where: "status = 'pending'",
        name: "index_appointment_requests_one_pending_per_guest"
      t.index [ :nutritionist_id, :status, :starts_at ]

      t.exclusion_constraint "nutritionist_id WITH =, tsrange(starts_at, ends_at) WITH &&",
        using: :gist, where: "status = 'accepted'",
        name: "appointment_requests_no_overlapping_accepted"
    end
  end
end
