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
