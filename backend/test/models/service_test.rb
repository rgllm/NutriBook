require "test_helper"

class ServiceTest < ActiveSupport::TestCase
  setup do
    @service = services(:mary_first_appointment)
  end

  test "fixture is valid" do
    assert @service.valid?
  end

  test "requires name and location" do
    service = Service.new(nutritionist: nutritionists(:mary_jane))

    assert_not service.valid?
    assert_includes service.errors[:name], "can't be blank"
    assert_includes service.errors[:location], "can't be blank"
  end

  test "price may be zero but not negative" do
    @service.price = 0
    assert @service.valid?

    @service.price = -1
    assert_not @service.valid?
    assert_includes @service.errors[:price], "must be greater than or equal to 0"
  end

  test "duration must be a positive whole number of minutes" do
    @service.duration_minutes = 0
    assert_not @service.valid?

    @service.duration_minutes = 30.5
    assert_not @service.valid?
    assert_includes @service.errors[:duration_minutes], "must be an integer"
  end

  test "a negative price is rejected by the database" do
    assert_raises(ActiveRecord::CheckViolation) { @service.update_column(:price, -1) }
  end

  test "a zero duration is rejected by the database" do
    assert_raises(ActiveRecord::CheckViolation) { @service.update_column(:duration_minutes, 0) }
  end

  test "cannot be destroyed while it has appointment requests" do
    assert_not @service.destroy
    assert Service.exists?(@service.id)
  end
end
