require "test_helper"

class AppointmentAnswerEmailJobTest < ActiveJob::TestCase
  include ActionMailer::TestHelper

  # An SMTP server that never answers.
  class TimingOutDelivery
    def initialize(*); end
    def deliver!(*) = raise(Net::ReadTimeout)
  end
  ActionMailer::Base.add_delivery_method :timing_out, TimingOutDelivery

  setup { travel_to Time.utc(2026, 11, 20, 12, 0) }

  test "emails the guest and records when" do
    request = appointment_requests(:accepted)

    assert_emails 1 do
      AppointmentAnswerEmailJob.perform_now(request.id)
    end

    assert_equal [ request.guest_email ], ActionMailer::Base.deliveries.last.to
    assert_equal Time.current, request.reload.answer_notified_at
  end

  test "a retry after a successful send emails no one" do
    request = appointment_requests(:rejected)
    AppointmentAnswerEmailJob.perform_now(request.id)

    assert_no_emails do
      AppointmentAnswerEmailJob.perform_now(request.id)
    end
  end

  test "a failed send leaves the request unnotified and retries" do
    request = appointment_requests(:accepted)
    AppointmentRequestMailer.delivery_method = :timing_out

    assert_enqueued_with(job: AppointmentAnswerEmailJob, args: [ request.id ]) do
      AppointmentAnswerEmailJob.perform_now(request.id)
    end
    assert_nil request.reload.answer_notified_at
  ensure
    AppointmentRequestMailer.delivery_method = :test
  end
end

# Runs the job through Solid Queue, which only records a failed execution once
# the job's own retries give up.
class AppointmentAnswerEmailJobExhaustionTest < ActiveSupport::TestCase
  setup do
    travel_to Time.utc(2026, 11, 20, 12, 0)
    AppointmentRequestMailer.delivery_method = :timing_out
  end

  teardown { AppointmentRequestMailer.delivery_method = :test }

  def queue_adapter_for_test
    ActiveJob::QueueAdapters::SolidQueueAdapter.new
  end

  test "an email that never sends keeps the answer and fails after ten attempts" do
    request = appointment_requests(:accepted)
    log = StringIO.new

    with_job_logger(Logger.new(log)) do
      AppointmentAnswerEmailJob.perform_later(request.id)
      assert_equal 10, run_queue_until_empty
    end

    request.reload
    assert request.accepted?
    assert_nil request.answer_notified_at

    failed = SolidQueue::FailedExecution.sole
    assert_equal "AppointmentAnswerEmailJob", failed.job.class_name
    assert_equal "Net::ReadTimeout", failed.exception_class
    assert_match "Stopped retrying AppointmentAnswerEmailJob", log.string
    assert_match "reoccurred on 10 attempts", log.string
  end

  private

  def run_queue_until_empty
    worker = SolidQueue::Process.create!(kind: "Worker", name: "test-worker", pid: ::Process.pid,
      hostname: "test", last_heartbeat_at: Time.current)
    attempts = 0

    loop do
      travel 1.day
      SolidQueue::ScheduledExecution.dispatch_next_batch(10)
      claimed = SolidQueue::ReadyExecution.claim("*", 1, worker.id)
      return attempts if claimed.empty?

      attempts += 1
      claimed.each do |execution|
        execution.perform
      rescue Net::ReadTimeout
      end
    end
  end

  def with_job_logger(logger)
    previous, ActiveJob::Base.logger = ActiveJob::Base.logger, logger
    yield
  ensure
    ActiveJob::Base.logger = previous
  end
end
