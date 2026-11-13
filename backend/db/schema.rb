# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_13_104948) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "btree_gist"
  enable_extension "pg_catalog.plpgsql"

  create_table "appointment_requests", force: :cascade do |t|
    t.bigint "service_id", null: false
    t.bigint "nutritionist_id", null: false
    t.string "guest_name", null: false
    t.string "guest_email", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.string "status", default: "pending", null: false
    t.datetime "answered_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "lower((guest_email)::text)", name: "index_appointment_requests_one_pending_per_guest", unique: true, where: "((status)::text = 'pending'::text)"
    t.index ["nutritionist_id", "status", "starts_at"], name: "idx_on_nutritionist_id_status_starts_at_b75b60395a"
    t.index ["service_id"], name: "index_appointment_requests_on_service_id"
    t.check_constraint "(answered_at IS NOT NULL) = (status::text = ANY (ARRAY['accepted'::character varying, 'rejected'::character varying]::text[]))", name: "appointment_requests_answered_at_matches_status"
    t.check_constraint "ends_at > starts_at", name: "appointment_requests_ends_after_starts"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'superseded'::character varying]::text[])", name: "appointment_requests_status_allowed"
    t.exclusion_constraint "nutritionist_id WITH =, tsrange(starts_at, ends_at) WITH &&", where: "(status)::text = 'accepted'::text", using: :gist, name: "appointment_requests_no_overlapping_accepted"
  end

  create_table "nutritionists", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.string "title", null: false
    t.string "license_number", null: false
    t.boolean "offers_online", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_nutritionists_on_slug", unique: true
    t.check_constraint "title::text = ANY (ARRAY['Dietitian'::character varying, 'Nutritionist'::character varying]::text[])", name: "nutritionists_title_allowed"
  end

  create_table "services", force: :cascade do |t|
    t.bigint "nutritionist_id", null: false
    t.string "name", null: false
    t.decimal "price", precision: 8, scale: 2, null: false
    t.string "location", null: false
    t.string "address", null: false
    t.integer "duration_minutes", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["location", "nutritionist_id"], name: "index_services_on_location_and_nutritionist_id"
    t.index ["nutritionist_id", "id"], name: "index_services_on_nutritionist_id_and_id", unique: true
    t.check_constraint "duration_minutes > 0", name: "services_duration_positive"
    t.check_constraint "price >= 0::numeric", name: "services_price_not_negative"
  end

  add_foreign_key "appointment_requests", "nutritionists"
  add_foreign_key "appointment_requests", "services", column: ["nutritionist_id", "service_id"], primary_key: ["nutritionist_id", "id"]
  add_foreign_key "services", "nutritionists"
end
