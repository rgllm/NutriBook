require "test_helper"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  test "lists each city with a service once, in alphabetical order" do
    get locations_url

    assert_response :success
    assert_equal({ "locations" => [ "Braga", "Porto" ] }, response.parsed_body)
  end
end
