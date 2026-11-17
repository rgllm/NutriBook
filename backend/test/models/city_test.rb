require "test_helper"

class CityTest < ActiveSupport::TestCase
  test "fixture is valid" do
    assert cities(:braga).valid?
  end

  test "names are unique" do
    city = City.new(name: "Braga")

    assert_not city.valid?
    assert_includes city.errors[:name], "has already been taken"
  end

  test "a service must be in a known city" do
    assert_raises(ActiveRecord::InvalidForeignKey) { services(:mary_first_appointment).update_column(:city, "Atlantis") }
  end

  test "a city with services cannot be deleted" do
    assert_not cities(:braga).destroy
    assert City.exists?(name: "Braga")
  end

  test "the nearest city is the one with the nearest located service" do
    porto = Coordinates.new(latitude: 41.12, longitude: -8.61)
    assert_equal [ "Porto" ], City.nearest_to(porto).pluck(:name)

    services(:ana_sports_nutrition).update!(latitude: nil, longitude: nil)
    assert_equal [ "Braga" ], City.nearest_to(porto).pluck(:name)
  end
end
