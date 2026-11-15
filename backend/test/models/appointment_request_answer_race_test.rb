require "test_helper"

# Two overlapping requests accepted at the same moment. Each thread needs its
# own connection and real commits, so this test runs outside the usual
# per-test transaction and cleans up after itself.
class AppointmentRequestAnswerRaceTest < ActiveSupport::TestCase
  self.use_transactional_tests = false

  EMAILS = %w[first.race@example.com second.race@example.com].freeze

  setup do
    day = BookingSchedule::TIME_ZONE.today.next_occurring(:monday).iso8601
    @first, @second = EMAILS.zip(%i[mary_first_appointment mary_follow_up]).map do |email, service|
      AppointmentRequest.submit(
        service_id: services(service).id, guest_name: "Race Guest", guest_email: email,
        starts_at: BookingSchedule.starts_at(day, "10:00")
      )
    end
  end

  teardown { AppointmentRequest.where(guest_email: EMAILS).delete_all }

  test "a second accept waits for the first instead of deadlocking, then finds its request rejected" do
    in_flight = Concurrent::CountDownLatch.new(1)
    release = Concurrent::CountDownLatch.new(1)

    # Pauses the first accept once it holds its locks and has checked its own
    # request. Without the nutritionist lock, the second accept would now lock
    # its request too, and each would wait on the other's.
    @first.define_singleton_method(:overlaps_accepted?) do
      in_flight.count_down
      release.wait(5)
      super()
    end
    slow = Thread.new { @first.answer!("accepted") }
    in_flight.wait(5)

    fast = Thread.new do
      @second.answer!("accepted")
    rescue AppointmentRequest::NotAnswerable => error
      error
    end
    wait_until_blocked_on_a_lock
    release.count_down

    assert_equal [ @second.id ], slow.value
    assert_equal "This request was already rejected.", fast.value.message
    assert @first.reload.accepted?
    assert @second.reload.rejected?
  end
end
