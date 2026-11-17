require "test_helper"

class NutritionistsControllerTest < ActionDispatch::IntegrationTest
  test "lists the nutritionists at the location with their services there" do
    mary = nutritionists(:mary_jane)

    get nutritionists_url, params: { q: "follow", location: "Braga" }

    assert_schema_conform(200)
    assert_equal [
      {
        "id" => mary.id,
        "name" => "Mary Jane",
        "title" => "Dietitian",
        "license_number" => "2963N",
        "offers_online" => true,
        "services" => [
          {
            "id" => services(:mary_first_appointment).id,
            "name" => "First appointment",
            "price" => "25.0",
            "street_address" => "Rua do Souto 45",
            "city" => "Braga",
            "duration_minutes" => 60,
            "distance_km" => nil
          },
          {
            "id" => services(:mary_follow_up).id,
            "name" => "Follow-up",
            "price" => "20.0",
            "street_address" => "Rua do Souto 45",
            "city" => "Braga",
            "duration_minutes" => 30,
            "distance_km" => nil
          }
        ],
        "nearest_service_id" => nil
      }
    ], response.parsed_body["nutritionists"]
    assert_equal({ "city" => "Braga", "source" => "input" }, response.parsed_body["location"])
  end

  test "typed and nearby searches tolerate service typos" do
    get nutritionists_url, params: { q: "sprts nutrition", location: "Porto" }
    assert_schema_conform(200)
    assert_equal [ "Ana Ferreira" ], response.parsed_body["nutritionists"].pluck("name")

    post nearby_nutritionists_url, params: { q: "sprts nutrition", latitude: 41.55, longitude: -8.426 }, as: :json
    assert_schema_conform(200)
    assert_equal services(:ana_sports_nutrition).id, response.parsed_body["nutritionists"].sole["nearest_service_id"]
  end

  test "without a location it searches Braga by default" do
    get nutritionists_url

    assert_schema_conform(200)
    assert_equal({ "city" => "Braga", "source" => "default" }, response.parsed_body["location"])
    assert_equal [ "Mary Jane" ], response.parsed_body["nutritionists"].pluck("name")
  end

  test "an unknown location falls back to Braga" do
    get nutritionists_url, params: { location: "Atlantis" }

    assert_schema_conform(200)
    assert_equal({ "city" => "Braga", "source" => "fallback" }, response.parsed_body["location"])
    assert_equal [ "Mary Jane" ], response.parsed_body["nutritionists"].pluck("name")
  end

  test "reports pagination and clamps a page past the end" do
    get nutritionists_url, params: { location: "porto", page: "4" }

    assert_schema_conform(200)
    assert_equal [ "Ana Ferreira" ], response.parsed_body["nutritionists"].pluck("name")
    assert_equal(
      { "page" => 1, "per_page" => 5, "total_count" => 1, "total_pages" => 1 },
      response.parsed_body["pagination"]
    )
  end

  test "no match returns an empty first page" do
    get nutritionists_url, params: { q: "nobody", location: "Porto" }

    assert_schema_conform(200)
    assert_empty response.parsed_body["nutritionists"]
    assert_equal(
      { "page" => 1, "per_page" => 5, "total_count" => 0, "total_pages" => 1 },
      response.parsed_body["pagination"]
    )
  end

  test "searches every city nearest a position sent in the body" do
    post nearby_nutritionists_url, params: { q: "sports", latitude: 41.5506, longitude: -8.426 }, as: :json

    assert_schema_conform(200)
    assert_equal({ "city" => nil, "source" => "nearby" }, response.parsed_body["location"])
    ana = response.parsed_body["nutritionists"].sole
    assert_equal services(:ana_sports_nutrition).id, ana["nearest_service_id"]
    assert_in_delta 46.96, ana["services"].sole["distance_km"], 0.01
  end

  test "keeps a typed location as a filter when searching nearby" do
    post nearby_nutritionists_url, params: { location: "Porto", latitude: 41.5506, longitude: -8.426 }, as: :json

    assert_schema_conform(200)
    assert_equal({ "city" => "Porto", "source" => "input" }, response.parsed_body["location"])
    assert_equal [ "Ana Ferreira" ], response.parsed_body["nutritionists"].pluck("name")
  end

  test "rejects a nearby search without a valid position" do
    [ {}, { latitude: 41.55 }, { latitude: 91, longitude: 0 } ].each do |params|
      post nearby_nutritionists_url, params:, as: :json

      assert_response_schema_confirm(422)
      assert_equal({ "errors" => { "coordinates" => [ "invalid" ] } }, response.parsed_body, params.inspect)
    end
  end

  test "keeps the position out of the logs" do
    assert_equal "[FILTERED]", ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters).filter("latitude" => 41.55)["latitude"]
  end
end
