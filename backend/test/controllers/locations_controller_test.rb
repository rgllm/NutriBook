require "test_helper"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  test "lists each city with a service once, in alphabetical order, and the default" do
    get locations_url

    assert_schema_conform(200)
    assert_equal({ "locations" => [ "Braga", "Porto" ], "default" => "Braga" }, response.parsed_body)
  end

  test "finds the searchable city nearest a point" do
    get nearest_locations_url, params: { latitude: "41.12", longitude: "-8.61" }

    assert_schema_conform(200)
    assert_equal({ "city" => "Porto" }, response.parsed_body)
  end

  test "rejects missing, non-numeric, and out-of-range coordinates" do
    [
      {},
      { latitude: "41.12" },
      { latitude: "north", longitude: "-8.61" },
      { latitude: "NaN", longitude: "-8.61" },
      { latitude: "91", longitude: "-8.61" },
      { latitude: "41.12", longitude: "-181" }
    ].each do |params|
      get nearest_locations_url, params: params

      assert_response_schema_confirm(422)
      assert_equal({ "errors" => { "coordinates" => [ "invalid" ] } }, response.parsed_body, params.inspect)
    end
  end

  test "is not found while no city has a service" do
    AppointmentRequest.delete_all
    Service.delete_all

    get nearest_locations_url, params: { latitude: "41.12", longitude: "-8.61" }

    assert_schema_conform(404)
    assert_equal({ "error" => "City not found" }, response.parsed_body)
  end
end
