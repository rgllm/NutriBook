require "test_helper"

class DemoGuideTest < ActiveSupport::TestCase
  test "links the nutritionist with most pending requests and explains which ones overlap" do
    mary = nutritionists(:mary_jane)
    pending_request(guest_name: "Luís Costa", starts_at: Time.utc(2026, 12, 1, 10, 30))
    pending_request(guest_name: "Sara Dias", starts_at: Time.utc(2026, 12, 2, 9))

    guide = DemoGuide.new(base_url: "http://app.test").to_s

    assert_includes guide, "**#{mary.name}, with 3 pending requests:** http://app.test/nutritionists/#{mary.id}/requests"
    assert_includes guide, "Accepting Rita Gomes also rejects Luís Costa's request, which overlaps it. " \
      "Both cards leave and the toast reads \"1 overlapping request was rejected.\""
    assert_includes guide, "Sara Dias doesn't overlap anyone"
  end

  test "links a nutritionist without requests and IDs that 404" do
    ana = nutritionists(:ana_ferreira)
    missing_id = [ 999_999, Nutritionist.maximum(:id) + 1 ].max

    guide = DemoGuide.new(base_url: "http://app.test").to_s

    assert_includes guide, "**#{ana.name}, with no requests:** http://app.test/nutritionists/#{ana.id}/requests"
    assert_includes guide, "http://app.test/nutritionists/#{missing_id}/requests shows the 404 page"
    assert_includes guide, "http://app.test/nutritionists/1abc/requests returns a real 404"
  end

  test "says how to get requests back when none are pending" do
    AppointmentRequest.pending.update_all(status: "superseded")

    assert_match(/No pending requests/, DemoGuide.new.to_s)
  end

  private

  # Inserted directly, because the model refuses times in the past.
  def pending_request(guest_name:, starts_at:)
    service = services(:mary_follow_up)
    AppointmentRequest.insert!({
      service_id: service.id, nutritionist_id: service.nutritionist_id, guest_name:,
      guest_email: "#{guest_name.parameterize}@example.com", starts_at:,
      ends_at: starts_at + service.duration_minutes.minutes, status: "pending"
    })
  end
end
