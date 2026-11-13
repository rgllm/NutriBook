require "test_helper"

class NutritionistsControllerTest < ActionDispatch::IntegrationTest
  test "lists the nutritionists in the city with their services" do
    mary = nutritionists(:mary_jane)

    get nutritionists_url, params: { q: "follow", location: "Braga" }

    assert_response :success
    assert_equal [
      {
        "id" => mary.id,
        "slug" => "mary-jane",
        "name" => "Mary Jane",
        "title" => "Dietitian",
        "license_number" => "2963N",
        "city" => "Braga",
        "address" => "Rua do Souto 45",
        "offers_online" => true,
        "services" => [
          {
            "id" => services(:mary_first_appointment).id,
            "name" => "First appointment",
            "price" => "25.0",
            "duration_minutes" => 60
          },
          {
            "id" => services(:mary_follow_up).id,
            "name" => "Follow-up",
            "price" => "20.0",
            "duration_minutes" => 30
          }
        ]
      }
    ], response.parsed_body["nutritionists"]
    assert_equal({ "city" => "Braga", "source" => "input" }, response.parsed_body["location"])
  end

  test "without a location it searches Braga by default" do
    get nutritionists_url

    assert_response :success
    assert_equal({ "city" => "Braga", "source" => "default" }, response.parsed_body["location"])
    assert_equal [ "Mary Jane" ], response.parsed_body["nutritionists"].pluck("name")
  end

  test "an unknown location falls back to Braga" do
    get nutritionists_url, params: { location: "Atlantis" }

    assert_response :success
    assert_equal({ "city" => "Braga", "source" => "fallback" }, response.parsed_body["location"])
    assert_equal [ "Mary Jane" ], response.parsed_body["nutritionists"].pluck("name")
  end

  test "reports pagination and clamps a page past the end" do
    get nutritionists_url, params: { location: "porto", page: "4" }

    assert_response :success
    assert_equal [ "Ana Ferreira" ], response.parsed_body["nutritionists"].pluck("name")
    assert_equal(
      { "page" => 1, "per_page" => 5, "total_count" => 1, "total_pages" => 1 },
      response.parsed_body["pagination"]
    )
  end

  test "no match returns an empty first page" do
    get nutritionists_url, params: { q: "nobody", location: "Porto" }

    assert_response :success
    assert_empty response.parsed_body["nutritionists"]
    assert_equal(
      { "page" => 1, "per_page" => 5, "total_count" => 0, "total_pages" => 1 },
      response.parsed_body["pagination"]
    )
  end
end
