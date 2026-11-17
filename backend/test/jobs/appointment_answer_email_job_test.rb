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

  test "each guest is answered in the language they booked in, overlap rejections included" do
    english = submit("english@example.com", "en-GB", "First appointment", "10:00")
    portuguese = submit("portuguese@example.com", "pt-PT", "Follow-up", "10:00")

    english.answer!("accepted")
    perform_enqueued_jobs

    assert_equal "Your appointment with Mary Jane is confirmed", email_to(english).subject
    rejection = email_to(portuguese)
    assert_equal "O seu pedido de consulta com Mary Jane não foi aceite", rejection.subject
    assert_includes rejection.text_part.decoded, "Mary Jane aceitou outra consulta à mesma hora"
  end

  test "a retry after a successful send emails no one" do
    request = appointment_requests(:rejected)
    AppointmentAnswerEmailJob.perform_now(request.id)

    assert_no_emails do
      AppointmentAnswerEmailJob.perform_now(request.id)
    end
  end

  test "a network failure retries and the retry sends the email" do
    request = appointment_requests(:accepted)
    AppointmentRequestMailer.delivery_method = :failing
    AppointmentRequestMailer.failing_settings = { error: Socket::ResolutionError }

    assert_no_emails do
      assert_enqueued_with(job: AppointmentAnswerEmailJob, args: [ request.id ]) do
        AppointmentAnswerEmailJob.perform_now(request.id)
      end
    end
    assert_nil request.reload.answer_notified_at

    AppointmentRequestMailer.delivery_method = :test
    assert_emails 1 do
      perform_enqueued_jobs(only: AppointmentAnswerEmailJob)
    end
    assert_equal Time.current, request.reload.answer_notified_at
  ensure
    AppointmentRequestMailer.delivery_method = :test
    AppointmentRequestMailer.failing_settings = {}
  end

  private

  def submit(guest_email, language, service_name, time)
    service = nutritionists(:mary_jane).services.find_by!(name: service_name)
    AppointmentRequest.submit(service:, guest_name: guest_email.split("@").first.capitalize, guest_email:, language:,
      starts_at: BookingSchedule.starts_at("2026-12-07", time)).tap { |request| assert request.persisted? }
  end

  def email_to(request)
    ActionMailer::Base.deliveries.find { |email| email.to == [ request.guest_email ] }
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

  test "an email that never sends keeps the answer, fails after ten attempts, and can be retried by hand" do
    request = appointment_requests(:accepted)
    AppointmentRequestMailer.failing_settings = { error: Socket::ResolutionError }
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
    assert_equal "Socket::ResolutionError", failed.exception_class
    assert_match "Stopped retrying AppointmentAnswerEmailJob", log.string
    assert_match "reoccurred on 10 attempts", log.string

    AppointmentRequestMailer.delivery_method = :test
    assert_difference -> { ActionMailer::Base.deliveries.size }, 1 do
      failed.retry
      assert_equal 1, run_queue_until_empty
    end
    assert_not_nil request.reload.answer_notified_at
    assert_empty SolidQueue::FailedExecution.all
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
      rescue Socket::ResolutionError
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
