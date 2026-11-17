require "test_helper"

class AppointmentAnswerEmailJobTest < ActiveJob::TestCase
  include ActionMailer::TestHelper

  class FailingDelivery
    def initialize(settings)
      @error = settings.fetch(:error, Net::ReadTimeout)
    end

    def deliver!(*) = raise(@error, "delivery failed")
  end
  ActionMailer::Base.add_delivery_method :failing, FailingDelivery

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

  [ SocketError, Socket::ResolutionError, Net::OpenTimeout, Net::ReadTimeout, Net::WriteTimeout,
    Net::SMTPServerBusy, Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::ETIMEDOUT,
    Errno::EHOSTUNREACH, Errno::ENETUNREACH, Errno::EPIPE, EOFError ].each do |error|
    test "#{error} retries without marking the answer delivered" do
      request = appointment_requests(:accepted)
      AppointmentRequestMailer.delivery_method = :failing
      AppointmentRequestMailer.failing_settings = { error: error }

      assert_no_emails do
        assert_enqueued_with(job: AppointmentAnswerEmailJob, args: [ request.id ]) do
          AppointmentAnswerEmailJob.perform_now(request.id)
        end
      end
      assert_nil request.reload.answer_notified_at
      assert request.accepted?

      AppointmentRequestMailer.delivery_method = :test
      assert_emails 1 do
        perform_enqueued_jobs(only: AppointmentAnswerEmailJob)
      end
      assert_equal Time.current, request.reload.answer_notified_at
    ensure
      AppointmentRequestMailer.delivery_method = :test
      AppointmentRequestMailer.failing_settings = {}
    end
  end

  [ Net::SMTPFatalError, Net::SMTPAuthenticationError, Net::SMTPSyntaxError,
    Net::SMTPUnknownError, OpenSSL::SSL::SSLError, ArgumentError ].each do |error|
    test "#{error} fails without an automatic retry" do
      request = appointment_requests(:rejected)
      AppointmentRequestMailer.delivery_method = :failing
      AppointmentRequestMailer.failing_settings = { error: error }

      assert_no_enqueued_jobs do
        assert_raises(error) { AppointmentAnswerEmailJob.perform_now(request.id) }
      end
      assert_nil request.reload.answer_notified_at
      assert request.rejected?
    ensure
      AppointmentRequestMailer.delivery_method = :test
      AppointmentRequestMailer.failing_settings = {}
    end
  end
end

class AppointmentAnswerEmailJobExhaustionTest < ActiveSupport::TestCase
  setup do
    travel_to Time.utc(2026, 11, 20, 12, 0)
    AppointmentRequestMailer.delivery_method = :failing
  end

  teardown do
    AppointmentRequestMailer.delivery_method = :test
    AppointmentRequestMailer.failing_settings = {}
  end

  def queue_adapter_for_test
    ActiveJob::QueueAdapters::SolidQueueAdapter.new
  end

  [ Net::ReadTimeout, Socket::ResolutionError ].each do |error|
    test "#{error} exhausts ten attempts and supports manual recovery" do
      request = appointment_requests(:accepted)
      AppointmentRequestMailer.failing_settings = { error: error }
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
      assert_equal error.name, failed.exception_class
      assert_match "Stopped retrying AppointmentAnswerEmailJob", log.string
      assert_match "reoccurred on 10 attempts", log.string

      AppointmentRequestMailer.delivery_method = :test
      assert_difference -> { ActionMailer::Base.deliveries.size }, 1 do
        failed.retry
        assert_equal 1, run_queue_until_empty
      end
      assert_not_nil request.reload.answer_notified_at
      assert_empty SolidQueue::FailedExecution.all

      assert_no_difference -> { ActionMailer::Base.deliveries.size } do
        AppointmentAnswerEmailJob.perform_now(request.id)
      end
    end
  end

  test "a permanent SMTP failure goes straight to failed executions" do
    request = appointment_requests(:rejected)
    AppointmentRequestMailer.failing_settings = { error: Net::SMTPFatalError }
    AppointmentAnswerEmailJob.perform_later(request.id)

    assert_raises(Net::SMTPFatalError) { run_queue_until_empty }

    failed = SolidQueue::FailedExecution.sole
    assert_equal "Net::SMTPFatalError", failed.exception_class
    assert_empty SolidQueue::ScheduledExecution.all
    assert_nil request.reload.answer_notified_at
    assert request.rejected?
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
      rescue Net::ReadTimeout, Socket::ResolutionError
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
