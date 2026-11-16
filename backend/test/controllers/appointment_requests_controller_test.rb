require "test_helper"

class AppointmentRequestsControllerTest < ActionDispatch::IntegrationTest
  setup { travel_to Time.utc(2026, 11, 20, 12, 0) }

  test "lists the nutritionist's pending requests, soonest first" do
    mary = nutritionists(:mary_jane)
    overdue = travel_to(Time.utc(2026, 11, 10, 12, 0)) do
      submit(guest_email: "overdue@example.com", date: "2026-11-18", time: "09:00")
    end
    later = submit(guest_email: "later@example.com", date: "2026-12-07", time: "15:00")
    submit(guest_email: "ana.guest@example.com", service_id: services(:ana_sports_nutrition).id)

    get nutritionist_appointment_requests_url(mary)

    assert_schema_conform(200)
    assert_equal({ "id" => mary.id, "name" => "Mary Jane" }, response.parsed_body["nutritionist"])
    assert_equal [ overdue.id, appointment_requests(:pending).id, later.id ],
      response.parsed_body["appointment_requests"].pluck("id")
    assert_equal({
      "id" => appointment_requests(:pending).id,
      "guest_name" => "Rita Gomes",
      "guest_email" => "rita.gomes@example.com",
      "starts_at" => "2026-12-01T10:00:00.000Z",
      "ends_at" => "2026-12-01T11:00:00.000Z",
      "online" => false,
      "service" => { "id" => services(:mary_first_appointment).id, "name" => "First appointment" }
    }, response.parsed_body["appointment_requests"].second)
  end

  test "a nutritionist with no pending requests gets an empty list" do
    get nutritionist_appointment_requests_url(nutritionists(:ana_ferreira))

    assert_schema_conform(200)
    assert_empty response.parsed_body["appointment_requests"]
  end

  test "an unknown nutritionist is not found" do
    get nutritionist_appointment_requests_url(Nutritionist.maximum(:id) + 1)

    assert_schema_conform(404)
    assert_equal({ "error" => "Nutritionist not found" }, response.parsed_body)
  end

  test "a malformed id is not found instead of being cast to a number" do
    mary = nutritionists(:mary_jane)

    [ "#{mary.id}abc", "0#{mary.id}", "-#{mary.id}", "0", "abc" ].each do |id|
      get "/nutritionists/#{id}/appointment_requests"

      assert_response :not_found, "#{id} should not reach #{mary.name}"
    end
  end

  test "an id past the database's integer range is not found" do
    get nutritionist_appointment_requests_url("9" * 20)

    assert_schema_conform(404)
  end

  test "the query count does not grow with the number of requests" do
    mary = nutritionists(:mary_jane)
    one = count_queries { get nutritionist_appointment_requests_url(mary) }

    [ "11:00", "12:00", "14:00" ].each_with_index do |time, i|
      submit(guest_email: "guest#{i}@example.com", service_id: services(:mary_follow_up).id, time:)
    end
    many = count_queries { get nutritionist_appointment_requests_url(mary) }

    assert_equal 4, response.parsed_body["appointment_requests"].size
    assert_equal one, many
  end

  test "creates a pending request at the chosen time in Portugal" do
    service = services(:mary_first_appointment)

    post appointment_requests_url, params: request_params(online: "true"), as: :json

    assert_schema_conform(201)
    request = AppointmentRequest.find(response.parsed_body["id"])
    assert_equal({
      "id" => request.id,
      "status" => "pending",
      "guest_name" => "Joana Silva",
      "guest_email" => "joana.silva@example.com",
      "starts_at" => "2026-12-07T10:00:00.000Z",
      "ends_at" => "2026-12-07T11:00:00.000Z",
      "online" => true,
      "service" => {
        "id" => service.id,
        "name" => "First appointment",
        "street_address" => "Rua do Souto 45",
        "city" => "Braga"
      }
    }, response.parsed_body)
  end

  test "a new request supersedes the guest's pending one" do
    post appointment_requests_url, params: request_params(guest_email: "rita.gomes@example.com"), as: :json

    assert_schema_conform(201)
    assert appointment_requests(:pending).reload.superseded?
  end

  test "reports every invalid field" do
    assert_no_difference -> { AppointmentRequest.count } do
      post appointment_requests_url,
        params: { appointment_request: { guest_name: "", guest_email: "nope", date: "2026-12-06", time: "10:00" } },
        as: :json
    end

    assert_schema_conform(422)
    assert_equal({
      "service" => [ "blank" ],
      "guest_name" => [ "blank" ],
      "guest_email" => [ "invalid" ],
      "starts_at" => [ "not_a_slot" ]
    }, response.parsed_body["errors"])
  end

  test "rejects dotless email domains through the API" do
    [ "user@com", "user@localhost" ].each do |guest_email|
      assert_no_difference -> { AppointmentRequest.count } do
        post appointment_requests_url, params: request_params(guest_email:), as: :json
      end

      assert_schema_conform(422)
      assert_equal({ "guest_email" => [ "invalid" ] }, response.parsed_body["errors"])
    end
  end

  test "rejects guest names over the length limit through the API" do
    [ AppointmentRequest::GUEST_NAME_MAX_LENGTH + 1, 10_000 ].each do |length|
      assert_no_difference -> { AppointmentRequest.count } do
        post appointment_requests_url, params: request_params(guest_name: "a" * length), as: :json
      end

      assert_schema_conform(422)
      assert_equal({ "guest_name" => [ "too_long" ] }, response.parsed_body["errors"])
    end
  end

  test "rejects guest emails over the length limit through the API" do
    [ AppointmentRequest::GUEST_EMAIL_MAX_LENGTH + 1, 10_000 ].each do |length|
      guest_email = "#{"a" * (length - "@example.com".length)}@example.com"

      assert_no_difference -> { AppointmentRequest.count } do
        post appointment_requests_url, params: request_params(guest_email:), as: :json
      end

      assert_schema_conform(422)
      assert_equal({ "guest_email" => [ "too_long" ] }, response.parsed_body["errors"])
    end
  end

  test "accepts guest fields at their length limits through the API" do
    guest_name = "a" * AppointmentRequest::GUEST_NAME_MAX_LENGTH
    guest_email = "#{"a" * (AppointmentRequest::GUEST_EMAIL_MAX_LENGTH - "@example.com".length)}@example.com"

    assert_difference -> { AppointmentRequest.count }, 1 do
      post appointment_requests_url, params: request_params(guest_name:, guest_email:), as: :json
    end

    assert_schema_conform(201)
    request = AppointmentRequest.find(response.parsed_body["id"])
    assert request.pending?
    assert_equal [ guest_name, guest_email ], request.attributes.values_at("guest_name", "guest_email")
    assert_equal [ guest_name, guest_email ], response.parsed_body.values_at("guest_name", "guest_email")
  end

  test "an unknown service is reported on the service" do
    post appointment_requests_url, params: request_params(service_id: 0), as: :json

    assert_schema_conform(422)
    assert_equal({ "service" => [ "blank" ] }, response.parsed_body["errors"])
  end

  test "a time outside the schedule is reported on the start time" do
    post appointment_requests_url, params: request_params(date: "2026-12-06"), as: :json

    assert_schema_conform(422)
    assert_equal({ "starts_at" => [ "not_a_slot" ] }, response.parsed_body["errors"])
  end

  test "a malformed date asks for a day and time" do
    post appointment_requests_url, params: request_params(date: "next monday"), as: :json

    assert_schema_conform(422)
    assert_equal({ "starts_at" => [ "blank" ] }, response.parsed_body["errors"])
  end

  test "accepting a request rejects the overlapping ones" do
    request = appointment_requests(:pending)
    overlapping = submit(guest_email: "overlap@example.com", service_id: services(:mary_follow_up).id, date: "2026-12-01", time: "10:00")

    assert_enqueued_jobs 2, only: AppointmentAnswerEmailJob do
      patch nutritionist_appointment_request_url(nutritionists(:mary_jane), request), params: answer("accepted"), as: :json
    end

    assert_schema_conform(200)
    assert_equal({
      "id" => request.id,
      "status" => "accepted",
      "answered_at" => "2026-11-20T12:00:00.000Z",
      "rejected_ids" => [ overlapping.id ]
    }, response.parsed_body)
    assert overlapping.reload.rejected?
  end

  test "rejecting a request" do
    request = appointment_requests(:pending)

    patch nutritionist_appointment_request_url(nutritionists(:mary_jane), request), params: answer("rejected"), as: :json

    assert_schema_conform(200)
    assert_equal [ "rejected", [] ], response.parsed_body.values_at("status", "rejected_ids")
    assert request.reload.rejected?
  end

  test "a request is only found through its own nutritionist" do
    request = appointment_requests(:pending)

    [ [ nutritionists(:ana_ferreira), request ], [ nutritionists(:mary_jane), AppointmentRequest.maximum(:id) + 1 ] ].each do |nutritionist, id|
      patch nutritionist_appointment_request_url(nutritionist, id), params: answer("accepted"), as: :json

      assert_schema_conform(404)
      assert_equal({ "error" => "AppointmentRequest not found" }, response.parsed_body)
    end
    assert request.reload.pending?
  end

  test "a malformed request id is not found instead of being cast to a number" do
    request = appointment_requests(:pending)
    mary = nutritionists(:mary_jane)

    [ "#{request.id}abc", "0#{request.id}", "0" ].each do |id|
      patch "/nutritionists/#{mary.id}/appointment_requests/#{id}", params: answer("accepted"), as: :json

      assert_response :not_found, "#{id} should not reach request #{request.id}"
    end
    assert request.reload.pending?
  end

  test "an answered request is a conflict that reports its current status" do
    request = appointment_requests(:accepted)

    patch nutritionist_appointment_request_url(nutritionists(:mary_jane), request), params: answer("rejected"), as: :json

    assert_schema_conform(409)
    assert_equal({ "error" => "already_accepted", "status" => "accepted" }, response.parsed_body)
  end

  test "a status other than accepted or rejected is reported on the status" do
    patch nutritionist_appointment_request_url(nutritionists(:mary_jane), appointment_requests(:pending)),
      params: answer("superseded"), as: :json

    assert_schema_conform(422)
    assert_equal({ "status" => [ "not_an_answer" ] }, response.parsed_body["errors"])
  end

  private

  def answer(status)
    { appointment_request: { status: } }
  end

  def submit(**overrides)
    AppointmentRequest.submit(
      service_id: services(:mary_first_appointment).id, guest_name: "Guest", guest_email: "guest@example.com",
      starts_at: BookingSchedule.starts_at(overrides.delete(:date) || "2026-12-07", overrides.delete(:time) || "10:00"),
      **overrides
    ).tap { |request| assert request.persisted?, request.errors.full_messages.to_sentence }
  end

  def request_params(**overrides)
    {
      appointment_request: {
        service_id: services(:mary_first_appointment).id,
        guest_name: "Joana Silva",
        guest_email: "Joana.Silva@example.com",
        date: "2026-12-07",
        time: "10:00",
        **overrides
      }
    }
  end
end
