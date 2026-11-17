require "net/smtp"

# Emails the guest how their request was answered. AppointmentRequest#answer!
# enqueues it in the transaction that answers the request.
#
# A job can run again after a successful send. answer_notified_at, set under
# the row lock, turns that retry into a no-op. A crash or connection loss after
# SMTP acceptance but before the marker commits can still duplicate delivery.
class AppointmentAnswerEmailJob < ApplicationJob
  retry_on SocketError, Net::OpenTimeout, Net::ReadTimeout, Net::WriteTimeout, Net::SMTPServerBusy,
    Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::ETIMEDOUT, Errno::EHOSTUNREACH, Errno::ENETUNREACH,
    Errno::EPIPE, EOFError,
    wait: :polynomially_longer, attempts: 10

  def perform(appointment_request_id)
    appointment_request = AppointmentRequest.find(appointment_request_id)

    appointment_request.with_lock do
      next if appointment_request.answer_notified_at?

      AppointmentRequestMailer.answer(appointment_request).deliver_now
      appointment_request.update!(answer_notified_at: Time.current)
    end
  end
end
