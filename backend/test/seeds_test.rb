require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  test "seeding twice creates nothing new" do
    load_seeds

    assert_no_difference [ "City.count", "Nutritionist.count", "Service.count", "AppointmentRequest.count" ] do
      load_seeds
    end
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

  test "recreated demo requests use future Lisbon slots after time passes" do
    existing_ids = AppointmentRequest.ids
    load_seeds
    demo = AppointmentRequest.where.not(id: existing_ids)
    original_start = demo.minimum(:starts_at)
    demo.delete_all

    travel_to original_start + 3.months do
      load_seeds
      recreated = AppointmentRequest.where.not(id: existing_ids).order(:starts_at, :id)
      monday = BookingSchedule::TIME_ZONE.today.next_occurring(:monday)

      assert_equal [ "pending" ] * 4, recreated.pluck(:status)
      assert_equal [
        BookingSchedule.starts_at(monday.iso8601, "10:00"),
        BookingSchedule.starts_at(monday.iso8601, "10:00"),
        BookingSchedule.starts_at(monday.iso8601, "14:00"),
        BookingSchedule.starts_at((monday + 1).iso8601, "09:00")
      ], recreated.pluck(:starts_at)
      assert recreated.all? { |request| request.starts_at.future? }
      assert_equal [ 60, 30, 60, 30 ], recreated.map { |request| (request.ends_at - request.starts_at).to_i / 60 }
    end
  end

  test "reports what it seeded" do
    out, = capture_io { silence_warnings { Rails.application.load_seed } }

    assert_match(/\ASeeded \d+ nutritionists, \d+ services/, out)
    busy = Nutritionist.find(AppointmentRequest.pending.group(:nutritionist_id).count.max_by(&:last).first)
    assert_includes out, "#{busy.name}, with 4 seeded requests: http://localhost:3000/nutritionists/#{busy.id}/requests"
    assert_match(/Accepting .+ also rejects .+'s request, which overlaps it/, out)
    assert_match(%r{/nutritionists/\d+/requests shows the empty state}, out)
    assert_includes out, "/nutritionists/1abc/requests returns a real 404"
  end

  private

  def load_seeds
    # seeds.rb defines top-level constants, which warn when loaded again, and
    # prints a summary meant for whoever ran db:seed.
    silence_warnings { capture_io { Rails.application.load_seed } }
  end
end
