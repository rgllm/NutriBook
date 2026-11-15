# Emails the guest how their request was answered. AppointmentRequest#answer!
# enqueues it in the transaction that answers the request.
#
# Solid Queue runs a job at least once, so a retry can follow a send that
# succeeded. answer_notified_at, set under the row lock, turns that retry into a
# no-op. The one gap left is a crash between the SMTP server accepting the
# email and that column being written.
class AppointmentAnswerEmailJob < ApplicationJob
  retry_on Net::OpenTimeout, Net::ReadTimeout, Net::SMTPServerBusy, Errno::ECONNREFUSED, Errno::ECONNRESET,
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
