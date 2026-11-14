require "test_helper"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  test "lists each city with a service once, in alphabetical order, and the default" do
    get locations_url

    assert_schema_conform(200)
    assert_equal({ "locations" => [ "Braga", "Porto" ], "default" => "Braga" }, response.parsed_body)
  end
end
