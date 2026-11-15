require "test_helper"

class AppointmentRequestsControllerTest < ActionDispatch::IntegrationTest
  setup { travel_to Time.utc(2026, 11, 20, 12, 0) }

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
      "service" => [ "Choose a service." ],
      "guest_name" => [ "Enter your name." ],
      "guest_email" => [ "Enter a valid email, like name@example.com." ],
      "starts_at" => [ "Pick one of the available times." ]
    }, response.parsed_body["errors"])
  end

  test "an unknown service is reported on the service" do
    post appointment_requests_url, params: request_params(service_id: 0), as: :json

    assert_schema_conform(422)
    assert_equal({ "service" => [ "Choose a service." ] }, response.parsed_body["errors"])
  end

  test "a time outside the schedule is reported on the start time" do
    post appointment_requests_url, params: request_params(date: "2026-12-06"), as: :json

    assert_schema_conform(422)
    assert_equal({ "starts_at" => [ "Pick one of the available times." ] }, response.parsed_body["errors"])
  end

  test "a malformed date asks for a day and time" do
    post appointment_requests_url, params: request_params(date: "next monday"), as: :json

    assert_schema_conform(422)
    assert_equal({ "starts_at" => [ "Pick a day and time." ] }, response.parsed_body["errors"])
  end

  private

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
