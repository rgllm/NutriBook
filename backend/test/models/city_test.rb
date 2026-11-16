require "test_helper"

class CityTest < ActiveSupport::TestCase
  test "fixture is valid" do
    assert cities(:braga).valid?
  end

  test "names are unique" do
    city = City.new(name: "Braga", latitude: 0, longitude: 0)

    assert_not city.valid?
    assert_includes city.errors[:name], "has already been taken"
  end

  test "coordinates must be on the globe" do
    city = City.new(name: "Nowhere", latitude: 91, longitude: -181)

    assert_not city.valid?
    assert_predicate city.errors[:latitude], :any?
    assert_predicate city.errors[:longitude], :any?
  end

  test "the database rejects coordinates off the globe" do
    assert_raises(ActiveRecord::StatementInvalid) { cities(:braga).update_column(:latitude, 91) }
    assert_raises(ActiveRecord::StatementInvalid) { cities(:braga).update_column(:longitude, 181) }
  end

  test "a service must be in a known city" do
    assert_raises(ActiveRecord::InvalidForeignKey) { services(:mary_first_appointment).update_column(:city, "Atlantis") }
  end

  test "a city with services cannot be deleted" do
    assert_not cities(:braga).destroy
    assert City.exists?(name: "Braga")
  end

  test "orders the cities with services by distance from a point" do
    # Póvoa de Lanhoso, about 15 km from Braga and 55 km from Porto.
    assert_equal %w[Braga Porto], City.nearest_to(latitude: 41.58, longitude: -8.27).map(&:name)
    # Vila Nova de Gaia, across the river from Porto.
    assert_equal %w[Porto Braga], City.nearest_to(latitude: 41.12, longitude: -8.61).map(&:name)
  end

  test "leaves out cities without services, however close" do
    # Faro itself; its nearest city with a service is Porto.
    assert_equal "Porto", City.nearest_to(latitude: 37.02, longitude: -7.93).first.name
  end

  test "measures across the antimeridian and the poles" do
    assert_equal "Braga", City.nearest_to(latitude: 90, longitude: 180).first.name
    assert_equal "Porto", City.nearest_to(latitude: -90, longitude: -180).first.name
  end
end
