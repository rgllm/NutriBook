require "test_helper"

# Two submissions from the same guest at the same moment. Each thread needs its
# own connection and real commits, so this test runs outside the usual
# per-test transaction and cleans up after itself.
class AppointmentRequestSubmitRaceTest < ActiveSupport::TestCase
  self.use_transactional_tests = false

  EMAIL = "race@example.com".freeze

  setup do
    @day = BookingSchedule::TIME_ZONE.today.next_occurring(:monday).iso8601
    @first = AppointmentRequest.submit(attributes("09:00"))
  end

  teardown { AppointmentRequest.where(guest_email: EMAIL).delete_all }

  test "a submission made while another is in flight supersedes it instead of failing" do
    in_flight = Concurrent::CountDownLatch.new(1)
    release = Concurrent::CountDownLatch.new(1)

    # Holds its transaction open after superseding, as a slow request would.
    slow = Thread.new do
      AppointmentRequest.transaction do
        request = AppointmentRequest.submit(attributes("10:00"))
        in_flight.count_down
        release.wait(5)
        request
      end
    end
    in_flight.wait(5)

    fast = Thread.new { AppointmentRequest.submit(attributes("11:00")) }
    wait_until_blocked_on_a_lock
    release.count_down

    results = [ slow.value, fast.value ]
    assert results.all?(&:persisted?), results.map { |r| r.errors.full_messages }.inspect
    assert @first.reload.superseded?
    assert results.first.reload.superseded?
    assert results.last.reload.pending?
  end

  private

  def attributes(time)
    {
      service_id: services(:mary_first_appointment).id,
      guest_name: "Race Guest",
      guest_email: EMAIL,
      starts_at: BookingSchedule.starts_at(@day, time)
    }
  end
end
