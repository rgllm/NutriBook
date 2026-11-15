require "test_helper"

class AppointmentRequestTest < ActiveSupport::TestCase
  setup do
    travel_to Time.utc(2026, 11, 20, 12, 0)
    @service = services(:mary_first_appointment)
  end

  test "fixtures are valid" do
    AppointmentRequest.find_each { |request| assert request.valid?, request.errors.full_messages.to_sentence }
  end

  test "new requests start pending" do
    assert build_request.pending?
  end

  test "derives the nutritionist and end time from the service" do
    request = build_request(starts_at: Time.utc(2027, 1, 4, 9, 0))

    request.validate

    assert_equal @service.nutritionist, request.nutritionist
    assert_equal Time.utc(2027, 1, 4, 10, 0), request.ends_at
  end

  test "keeps its booked interval when the service duration changes later" do
    request = appointment_requests(:pending)
    booked_until = request.ends_at
    request.service.update!(duration_minutes: 90)

    request.update!(status: "accepted", answered_at: Time.current)

    assert_equal booked_until, request.reload.ends_at
  end

  test "recalculates the end time when the start time changes" do
    request = appointment_requests(:pending)

    request.update!(starts_at: Time.utc(2026, 12, 1, 15, 0))

    assert_equal Time.utc(2026, 12, 1, 16, 0), request.reload.ends_at
  end

  test "ignores a nutritionist that does not match the service" do
    request = build_request(nutritionist: nutritionists(:ana_ferreira))

    request.validate

    assert_equal nutritionists(:mary_jane), request.nutritionist
  end

  test "normalizes the guest email and name" do
    request = build_request(guest_email: "  Joana.Silva@Example.COM ", guest_name: "  Joana   Silva ")

    assert_equal "joana.silva@example.com", request.guest_email
    assert_equal "Joana Silva", request.guest_name
  end

  test "requires guest name, a valid email and a start time" do
    request = AppointmentRequest.new(service: @service, guest_email: "not-an-email")

    assert_not request.valid?
    assert_equal [ "Enter your name." ], request.errors[:guest_name]
    assert_equal [ "Enter a valid email, like name@example.com." ], request.errors[:guest_email]
    assert_equal [ "Pick a day and time." ], request.errors[:starts_at]
  end

  test "a blank email asks for one instead of calling it invalid" do
    request = build_request(guest_email: " ")

    assert_not request.valid?
    assert_equal [ "Enter your email." ], request.errors[:guest_email]
  end

  test "a missing service is reported once, on the service" do
    request = build_request(service: nil)

    assert_not request.valid?
    assert_equal [ "Choose a service." ], request.errors[:service]
    assert_empty request.errors[:nutritionist]
  end

  test "online only when the nutritionist offers it" do
    assert build_request(online: true).valid?

    request = build_request(service: services(:ana_sports_nutrition), online: true)
    assert_not request.valid?
    assert_equal [ "This nutritionist does not offer online appointments." ], request.errors[:online]
  end

  test "a new request must start in the future" do
    request = build_request(starts_at: Time.utc(2026, 11, 20, 11, 0))

    assert_not request.valid?
    assert_equal [ "Pick a time that has not passed yet." ], request.errors[:starts_at]
  end

  test "a new request must start on a bookable slot" do
    {
      "off the hour" => Time.utc(2026, 12, 3, 10, 30),
      "lunch hour" => Time.utc(2026, 12, 3, 13, 0),
      "before opening" => Time.utc(2026, 12, 3, 8, 0),
      "Sunday" => Time.utc(2026, 12, 6, 10, 0)
    }.each do |label, starts_at|
      request = build_request(starts_at:)

      assert_not request.valid?, label
      assert_equal [ "Pick one of the available times." ], request.errors[:starts_at], label
    end
  end

  test "a new request cannot overlap the nutritionist's accepted appointments" do
    # The accepted fixture runs from 14:00 to 14:30 UTC on 1 December.
    request = build_request(starts_at: Time.utc(2026, 12, 1, 14, 0))

    assert_not request.valid?
    assert_equal [ "This time is no longer available. Pick another." ], request.errors[:starts_at]
    assert build_request(starts_at: Time.utc(2026, 12, 1, 15, 0)).valid?
  end

  test "a request can still be answered after its time has passed" do
    travel_to Time.utc(2026, 12, 2, 12, 0)

    assert appointment_requests(:pending).update(status: "rejected", answered_at: Time.current)
  end

  test "submit supersedes the guest's pending request" do
    previous = appointment_requests(:pending)

    request = AppointmentRequest.submit(request_attributes(guest_email: "Rita.Gomes@example.com"))

    assert request.persisted?
    assert request.pending?
    assert previous.reload.superseded?
  end

  test "submit leaves other guests' pending requests alone" do
    request = AppointmentRequest.submit(request_attributes)

    assert request.persisted?
    assert appointment_requests(:pending).reload.pending?
  end

  test "a rejected submission keeps the guest's pending request" do
    request = AppointmentRequest.submit(request_attributes(guest_email: "rita.gomes@example.com", starts_at: nil))

    assert_not request.persisted?
    assert_equal [ "Pick a day and time." ], request.errors[:starts_at]
    assert appointment_requests(:pending).reload.pending?
  end

  test "rejects an unknown status" do
    request = build_request(status: "cancelled")

    assert_not request.valid?
    assert_includes request.errors[:status], "is not included in the list"
  end

  test "a guest has at most one pending request, ignoring email case" do
    # Raw SQL, because the model would lowercase the email before the index sees it.
    assert_raises(ActiveRecord::RecordNotUnique) do
      insert_raw(guest_email: "RITA.GOMES@example.com")
    end
  end

  test "a guest may keep answered and superseded requests next to a pending one" do
    assert_difference -> { AppointmentRequest.count }, 2 do
      build_request(guest_email: "rita.gomes@example.com", status: "superseded").save!
      build_request(guest_email: "rita.gomes@example.com", status: "rejected", answered_at: Time.current).save!
    end
  end

  test "accepted requests for the same nutritionist cannot overlap" do
    # The accepted fixture runs from 14:00 to 14:30 UTC on 1 December.
    overlapping = accepted_request(starts_at: Time.utc(2026, 12, 1, 14, 15))

    assert_raises(ActiveRecord::ExclusionViolation) { save_past_validations(overlapping) }
  end

  test "back-to-back accepted requests do not overlap" do
    adjacent = accepted_request(starts_at: Time.utc(2026, 12, 1, 14, 30))

    assert save_past_validations(adjacent)
  end

  test "overlap only matters for the same nutritionist" do
    other = accepted_request(service: services(:ana_sports_nutrition), starts_at: Time.utc(2026, 12, 1, 14, 0))

    assert other.save!
  end

  test "overlapping pending requests are allowed" do
    # The pending fixture runs from 10:00 to 11:00 UTC on 1 December.
    request = build_request(starts_at: Time.utc(2026, 12, 1, 10, 0))

    assert request.save!
  end

  test "the service must belong to the request's nutritionist" do
    request = appointment_requests(:pending)

    assert_raises(ActiveRecord::InvalidForeignKey) do
      request.update_column(:nutritionist_id, nutritionists(:ana_ferreira).id)
    end
  end

  test "a pending request cannot have answered_at" do
    assert_raises(ActiveRecord::CheckViolation) do
      appointment_requests(:pending).update_column(:answered_at, Time.current)
    end
  end

  test "an accepted request must have answered_at" do
    assert_raises(ActiveRecord::CheckViolation) do
      appointment_requests(:accepted).update_column(:answered_at, nil)
    end
  end

  test "ends_at must be after starts_at" do
    request = appointment_requests(:pending)

    assert_raises(ActiveRecord::CheckViolation) do
      request.update_column(:ends_at, request.starts_at)
    end
  end

  private

  def build_request(**attributes)
    AppointmentRequest.new(
      service: @service,
      guest_name: "Joana Silva",
      guest_email: "joana.silva@example.com",
      starts_at: Time.utc(2026, 12, 3, 10, 0),
      **attributes
    )
  end

  def request_attributes(**attributes)
    {
      service_id: @service.id,
      guest_name: "Joana Silva",
      guest_email: "joana.silva@example.com",
      starts_at: Time.utc(2026, 12, 3, 10, 0),
      **attributes
    }
  end

  def accepted_request(**attributes)
    build_request(status: "accepted", answered_at: Time.current, **attributes)
  end

  # Reaches the database constraints with times the model would refuse.
  def save_past_validations(request)
    request.validate
    request.save!(validate: false)
  end

  def insert_raw(guest_email:)
    service = @service
    sql = AppointmentRequest.sanitize_sql_array([ <<~SQL, service.id, service.nutritionist_id, guest_email ])
      INSERT INTO appointment_requests
        (service_id, nutritionist_id, guest_name, guest_email, starts_at, ends_at, status, created_at, updated_at)
      VALUES (?, ?, 'Rita Gomes', ?, '2026-12-05 10:00', '2026-12-05 11:00', 'pending', now(), now())
    SQL
    AppointmentRequest.connection.execute(sql)
  end
end
