# Tells a guest how a nutritionist answered their appointment request.
class AppointmentRequestMailer < ApplicationMailer
  helper_method :appointment_request, :nutritionist_name, :appointment_time, :appointment_place

  # The email for the answer the request holds: accepted or rejected.
  def self.answer(appointment_request)
    unless appointment_request.status.in?(AppointmentRequest::ANSWERS)
      raise ArgumentError, "request #{appointment_request.id} is #{appointment_request.status}, not answered"
    end

    with(appointment_request:).public_send(appointment_request.status)
  end

  def accepted
    mail to: recipient, subject: "Your appointment with #{nutritionist_name} is confirmed"
  end

  def rejected
    mail to: recipient, subject: "Your appointment request with #{nutritionist_name} was not accepted"
  end

  private

  def appointment_request = params[:appointment_request]

  def nutritionist_name = appointment_request.nutritionist.name

  def recipient
    email_address_with_name(appointment_request.guest_email, appointment_request.guest_name)
  end

  # Guests book in Portuguese wall-clock time, so the email uses it too.
  def appointment_time
    starts_at, ends_at = appointment_request.values_at(:starts_at, :ends_at).map { |time| time.in_time_zone(BookingSchedule::TIME_ZONE) }
    "#{starts_at.strftime("%A, %-d %B %Y, %H:%M")} to #{ends_at.strftime("%H:%M")} (Lisbon time)"
  end

  def appointment_place
    return "Online" if appointment_request.online?

    service = appointment_request.service
    "#{service.street_address}, #{service.city}"
  end
end
