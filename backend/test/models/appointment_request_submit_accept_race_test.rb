require "test_helper"

# A guest submits a request while the nutritionist accepts an overlapping one.
# Each thread needs its own connection and real commits, so this test runs
# outside the usual per-test transaction and cleans up after itself.
class AppointmentRequestSubmitAcceptRaceTest < ActiveSupport::TestCase
  self.use_transactional_tests = false

  ACCEPTED_EMAIL = "accepted.race@example.com".freeze
  OVERLAP_EMAIL = "overlap.race@example.com".freeze

  setup do
    @day = BookingSchedule::TIME_ZONE.today.next_occurring(:monday).iso8601
    @accepting = AppointmentRequest.submit(attributes(ACCEPTED_EMAIL, :mary_first_appointment))
    @in_flight = Concurrent::CountDownLatch.new(1)
    @release = Concurrent::CountDownLatch.new(1)
  end

  teardown do
    @release.count_down
    AppointmentRequest.where(guest_email: [ ACCEPTED_EMAIL, OVERLAP_EMAIL ]).delete_all
  end

  test "a submission made while an overlapping accept is in flight is refused as taken" do
    accept = hold_open { @accepting.answer!("accepted") }
    submit = Thread.new { AppointmentRequest.submit(attributes(OVERLAP_EMAIL, :mary_follow_up)) }
    wait_until_blocked_on_a_lock
    @release.count_down

    assert_equal [], accept.value
    assert_equal [ :taken ], submit.value.error_codes[:starts_at]
    assert_empty pending_overlapping(@accepting)
    assert_equal [ @accepting.id ], answer_email_ids
  end

  test "an accept made while an overlapping submission is in flight rejects it and emails its guest" do
    submit = hold_open { AppointmentRequest.submit(attributes(OVERLAP_EMAIL, :mary_follow_up)) }
    accept = Thread.new { @accepting.answer!("accepted") }
    wait_until_blocked_on_a_lock
    @release.count_down

    submitted = submit.value
    assert_equal [ submitted.id ], accept.value
    assert submitted.reload.rejection_overlap?
    assert_empty pending_overlapping(@accepting)
    assert_equal [ @accepting.id, submitted.id ].sort, answer_email_ids.sort
  end

  test "a guest moving their pending request to another nutritionist does not deadlock an overlapping accept" do
    moving = AppointmentRequest.submit(attributes(OVERLAP_EMAIL, :mary_follow_up))

    # Holds the supersede of the guest's request, which the accept must lock
    # to reject it as overlapping.
    submit = hold_open { AppointmentRequest.submit(attributes(OVERLAP_EMAIL, :ana_sports_nutrition)) }
    accept = Thread.new { @accepting.answer!("accepted") }
    wait_until_blocked_on_a_lock
    @release.count_down

    assert submit.value.reload.pending?
    assert_equal [], accept.value
    assert moving.reload.superseded?
    assert_equal [ @accepting.id ], answer_email_ids
  end

  private

  # Runs the block in a thread whose transaction stays open until released, as
  # a slow request would.
  def hold_open(&block)
    Thread.new do
      AppointmentRequest.transaction do
        block.call.tap do
          @in_flight.count_down
          @release.wait(5)
        end
      end
    end.tap { @in_flight.wait(5) }
  end

  def attributes(email, service)
    {
      service_id: services(service).id,
      guest_name: "Race Guest",
      guest_email: email,
      starts_at: BookingSchedule.starts_at(@day, "10:00")
    }
  end

  def pending_overlapping(request)
    AppointmentRequest.pending.where(nutritionist_id: request.nutritionist_id).overlapping(request.starts_at, request.ends_at)
  end

  def answer_email_ids
    enqueued_jobs.select { |job| job[:job] == AppointmentAnswerEmailJob }.map { |job| job[:args].first }
  end
end
