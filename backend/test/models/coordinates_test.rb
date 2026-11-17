require "test_helper"

class CoordinatesTest < ActiveSupport::TestCase
  test "parses a point from strings or numbers" do
    assert_equal Coordinates.new(latitude: 41.55, longitude: -8.43), Coordinates.parse("41.55", "-8.43")
    assert_equal Coordinates.new(latitude: 41.55, longitude: -8.43), Coordinates.parse(41.55, -8.43)
  end

  test "rejects missing, non-numeric, and off-globe values" do
    [ [ nil, "-8.43" ], [ "41.55", nil ], [ "north", "-8.43" ], [ "NaN", "-8.43" ], [ "Infinity", "0" ], [ "91", "0" ], [ "0", "-181" ] ].each do |latitude, longitude|
      assert_nil Coordinates.parse(latitude, longitude), [ latitude, longitude ].inspect
    end
  end

  test "measures great-circle kilometres in SQL" do
    # Braga's Rua do Souto to Porto's Rua de Santa Catarina: 46.96 km by an independent haversine.
    braga = Coordinates.new(latitude: 41.550586, longitude: -8.426007)
    distance = Service.where(id: services(:ana_sports_nutrition)).pick(Arel.sql(braga.distance_km_sql("services")))

    assert_in_delta 46.96, distance, 0.01
  end

  test "is unknown where the service has no coordinates" do
    services(:ana_sports_nutrition).update_columns(latitude: nil, longitude: nil)
    braga = Coordinates.new(latitude: 41.550586, longitude: -8.426007)

    assert_nil Service.where(id: services(:ana_sports_nutrition)).pick(Arel.sql(braga.distance_km_sql("services")))
  end
end
