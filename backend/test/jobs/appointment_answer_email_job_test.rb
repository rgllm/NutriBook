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
