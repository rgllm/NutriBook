require "net/smtp"

# Emails the guest how their request was answered. AppointmentRequest#answer!
# enqueues it in the transaction that answers the request.
#
# Retries are bounded, and a permanent error fails the job at once, so an email
# can end up never delivered. The job sends while holding the row lock, but
# SMTP does not take part in the database transaction and cannot be rolled
# back. answer_notified_at is written after the send returns and commits when
# the transaction completes. A run after that commit sends nothing.
# A failure after the SMTP server accepts the message but before the marker
# commits rolls the marker back and can deliver twice. That includes a timeout
# or reset on the reply to DATA or QUIT, which retry_on retries.
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
