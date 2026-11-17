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

  test "reseeding moves only overdue pending demo requests to future slots" do
    travel_to BookingSchedule::TIME_ZONE.local(2026, 10, 19, 12) do
      existing_ids = AppointmentRequest.ids
      load_seeds
      seeded = AppointmentRequest.where.not(id: existing_ids).order(:id).to_a
      accepted, rejected, future, overdue = seeded
      accepted.update!(status: "accepted", answered_at: Time.current)
      rejected.update!(status: "rejected", rejection_reason: "declined", answered_at: Time.current)
      future.update!(starts_at: BookingSchedule.starts_at("2026-12-07", "14:00"))
      preserved = [ accepted, rejected, future ].map(&:attributes)
      unrelated = appointment_requests(:pending)
      unrelated.update!(starts_at: BookingSchedule.starts_at("2026-10-20", "09:00"))
      unrelated_before = unrelated.attributes

      travel_to BookingSchedule::TIME_ZONE.local(2026, 11, 17, 12)
      assert_no_enqueued_jobs do
        assert_no_difference -> { AppointmentRequest.count } do
          load_seeds
        end
      end
      assert_equal preserved, [ accepted, rejected, future ].map { |request| request.reload.attributes }
      assert_equal unrelated_before, unrelated.reload.attributes
      assert_equal BookingSchedule.starts_at("2026-11-24", "09:00"), overdue.reload.starts_at
      assert_equal overdue.starts_at + overdue.service.duration_minutes.minutes, overdue.ends_at
      assert overdue.pending?
      assert_nil overdue.answered_at
      refreshed = overdue.attributes
      load_seeds
      assert_equal refreshed, overdue.reload.attributes
    end
  end

  test "reseeding preserves the overlap across a daylight saving change" do
    travel_to BookingSchedule::TIME_ZONE.local(2026, 10, 12, 12) do
      existing_ids = AppointmentRequest.ids
      load_seeds
      seeded = AppointmentRequest.where.not(id: existing_ids).order(:id).to_a
      travel_to BookingSchedule::TIME_ZONE.local(2026, 10, 27, 12)
      load_seeds
      first, second = seeded.first(2).map(&:reload)
      assert_equal BookingSchedule.starts_at("2026-11-02", "10:00"), first.starts_at
      assert_equal first.starts_at, second.starts_at
      assert_equal 10, first.starts_at.in_time_zone(BookingSchedule::TIME_ZONE).hour
    end
  end

  test "printed guide reflects answered requests and unrelated pending requests" do
    existing_ids = AppointmentRequest.ids
    load_seeds
    seeded = AppointmentRequest.where.not(id: existing_ids).order(:id).to_a
    seeded.first.answer!("accepted")

    out, = capture_io { silence_warnings { Rails.application.load_seed } }

    assert_includes out, "with 2 pending demo requests:"
    assert_includes out, "#{seeded.first.guest_name}: accepted"
    assert_includes out, "#{seeded.second.guest_name}: rejected"
    assert_not_includes out, "also rejects"
    seeded.each do |request|
      assert_includes out, request.starts_at.in_time_zone(BookingSchedule::TIME_ZONE).strftime("%Y-%m-%d %H:%M")
    end
  end

  test "reseeding leaves superseded demo requests and mismatched identities alone" do
    travel_to BookingSchedule::TIME_ZONE.local(2026, 10, 12, 12) do
      existing_ids = AppointmentRequest.ids
      load_seeds
      seeded = AppointmentRequest.where.not(id: existing_ids).order(:id).to_a
      seeded.first.update!(status: "superseded")
      seeded.second.update!(guest_name: "Another guest")
      seeded.third.update!(service: services(:ana_sports_nutrition))
      preserved = seeded.first(3).map(&:attributes)

      travel_to BookingSchedule::TIME_ZONE.local(2026, 11, 17, 12)
      load_seeds

      assert_equal preserved, seeded.first(3).map { |request| request.reload.attributes }
    end
  end

  test "printed empty-state link counts requests created through the app" do
    load_seeds
    idle = Nutritionist.find_by!(name: "Silas Saraiva")
    AppointmentRequest.submit(service: idle.services.first, guest_name: "New Guest",
      guest_email: "new.guest@example.com", starts_at: BookingSchedule.starts_at(
        BookingSchedule::TIME_ZONE.today.next_occurring(:monday).iso8601, "09:00"))

    out, = capture_io { silence_warnings { Rails.application.load_seed } }

    assert_includes out, "#{idle.name}, with 1 pending request:"
    assert_not_includes out, "#{idle.id}/requests shows the empty state"
  end

  test "reports what it seeded" do
    out, = capture_io { silence_warnings { Rails.application.load_seed } }

    assert_match(/\ASeeded \d+ nutritionists, \d+ services/, out)
    busy = Nutritionist.find(AppointmentRequest.pending.group(:nutritionist_id).count.max_by(&:last).first)
    assert_includes out, "#{busy.name}, with 4 pending demo requests: http://localhost:3000/nutritionists/#{busy.id}/requests"
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
