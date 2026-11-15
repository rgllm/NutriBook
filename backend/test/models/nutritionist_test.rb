require "test_helper"

class NutritionistTest < ActiveSupport::TestCase
  setup do
    @nutritionist = nutritionists(:mary_jane)
  end

  test "fixture is valid" do
    assert @nutritionist.valid?
  end

  test "requires name and license number" do
    nutritionist = Nutritionist.new

    assert_not nutritionist.valid?
    assert_includes nutritionist.errors[:name], "can't be blank"
    assert_includes nutritionist.errors[:license_number], "can't be blank"
  end

  test "title is one of the allowed values" do
    @nutritionist.title = "Doctor"

    assert_not @nutritionist.valid?
    assert_includes @nutritionist.errors[:title], "is not included in the list"
  end

  test "title is enforced by the database" do
    assert_raises(ActiveRecord::CheckViolation) do
      @nutritionist.update_column(:title, "Doctor")
    end
  end

  test "cannot be destroyed while it has services" do
    assert_not @nutritionist.destroy
    assert @nutritionist.errors.added?(:base, :"restrict_dependent_destroy.has_many", record: "services")
    assert Nutritionist.exists?(@nutritionist.id)
  end
end
