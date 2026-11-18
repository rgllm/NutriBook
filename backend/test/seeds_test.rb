require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  test "seeding twice creates nothing new" do
    load_seeds

    assert_no_difference [ "City.count", "Nutritionist.count", "Service.count", "AppointmentRequest.count" ] do
      load_seeds
    end
  end

  test "demo requests use December dates and reseeding refreshes old dates" do
    existing_ids = AppointmentRequest.ids
    load_seeds
    seeded = AppointmentRequest.where.not(id: existing_ids).order(:starts_at)
    expected = [
      BookingSchedule.starts_at("2026-12-21", "10:00"),
      BookingSchedule.starts_at("2026-12-21", "10:00"),
      BookingSchedule.starts_at("2026-12-21", "14:00"),
      BookingSchedule.starts_at("2026-12-22", "09:00")
    ]

    assert_equal expected, seeded.pluck(:starts_at)
    seeded.update_all("starts_at = starts_at - interval '60 days', ends_at = ends_at - interval '60 days'")
    load_seeds

    assert_equal expected, seeded.pluck(:starts_at)
    seeded.each do |request|
      assert_equal request.starts_at + request.service.duration_minutes.minutes, request.ends_at
    end
  end

  test "every demo practice has coordinates, the same for each service there" do
    load_seeds

    practices = Service.group(:city, :street_address).pluck(:city, :street_address, Arel.sql("count(DISTINCT (latitude, longitude))"), Arel.sql("bool_and(latitude IS NOT NULL)"))
    assert practices.all? { |*, coordinates, located| coordinates == 1 && located }, practices.inspect
  end

  test "reseeding keeps an answered demo request answered" do
    existing_ids = AppointmentRequest.ids
    load_seeds
    seeded = AppointmentRequest.where.not(id: existing_ids).order(:starts_at)
    answered = seeded.last
    answered.update!(status: "accepted", answered_at: Time.current)

    assert_no_difference -> { AppointmentRequest.count } do
      load_seeds
    end
    assert answered.reload.accepted?
  end

  test "reports what it seeded" do
    out, = capture_io { silence_warnings { Rails.application.load_seed } }

    assert_match(/\ASeeded \d+ nutritionists, \d+ services/, out)
    busy = Nutritionist.find(AppointmentRequest.pending.group(:nutritionist_id).count.max_by(&:last).first)
    assert_includes out, "#{busy.name}, with 4 seeded requests: http://localhost:3000/nutritionists/#{busy.id}/requests"
    assert_match(/Accepting .+ also rejects .+'s request, which overlaps it/, out)
    assert_match(%r{/nutritionists/\d+/requests shows the empty state}, out)
    assert_match(%r{/nutritionists/\d+/requests shows the not-found page}, out)
  end

  private

  def load_seeds
    # seeds.rb defines top-level constants, which warn when loaded again, and
    # prints a summary meant for whoever ran db:seed.
    silence_warnings { capture_io { Rails.application.load_seed } }
  end
end
