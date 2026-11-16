require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  test "seeding twice creates nothing new" do
    load_seeds

    assert_no_difference [ "Nutritionist.count", "Service.count", "AppointmentRequest.count" ] do
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
  end

  private

  def load_seeds
    # seeds.rb defines top-level constants, which warn when loaded again, and
    # prints a summary meant for whoever ran db:seed.
    silence_warnings { capture_io { Rails.application.load_seed } }
  end
end
