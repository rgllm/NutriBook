require "test_helper"

# The answer and its email jobs share one transaction. This runs against the
# real Solid Queue adapter, because the :test adapter records jobs even when
# the transaction that enqueued them rolls back.
class AppointmentRequestAnswerEmailAtomicityTest < ActiveSupport::TestCase
  setup { travel_to Time.utc(2026, 11, 20, 12, 0) }

  def queue_adapter_for_test
    ActiveJob::QueueAdapters::SolidQueueAdapter.new
  end

  test "a committed answer stores one email job per answered request" do
    request = appointment_requests(:pending)
    overlap_with(request)

    assert_difference -> { email_jobs.count }, 2 do
      request.answer!("accepted")
    end
  end

  test "an answer rolled back after it was made leaves no email job" do
    request = appointment_requests(:pending)
    overlap_with(request)

    assert_no_difference -> { email_jobs.count } do
      ApplicationRecord.transaction do
        request.answer!("accepted")
        raise ActiveRecord::Rollback
      end
    end
    assert request.reload.pending?
  end

  private

  def email_jobs = SolidQueue::Job.where(class_name: "AppointmentAnswerEmailJob")

  def overlap_with(request)
    AppointmentRequest.submit(
      service_id: request.service_id, guest_name: "Overlap Guest", guest_email: "overlap@example.com",
      starts_at: request.starts_at
    ).tap { |overlapping| assert overlapping.persisted?, overlapping.errors.full_messages.to_sentence }
  end
end
