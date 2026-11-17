# Tells a guest how a nutritionist answered their appointment request, in the
# language they booked in.
class AppointmentRequestMailer < ApplicationMailer
  helper_method :appointment_request, :nutritionist_name, :appointment_time, :appointment_place

  around_action :use_booking_language

  # The email for the answer the request holds: accepted or rejected.
  def self.answer(appointment_request)
    unless appointment_request.status.in?(AppointmentRequest::ANSWERS)
      raise ArgumentError, "request #{appointment_request.id} is #{appointment_request.status}, not answered"
    end

    with(appointment_request:).public_send(appointment_request.status)
  end

  def accepted
    mail to: recipient, subject: default_i18n_subject(nutritionist: nutritionist_name)
  end

  def rejected
    mail to: recipient, subject: default_i18n_subject(nutritionist: nutritionist_name)
  end

  private

  def appointment_request = params[:appointment_request]

  def nutritionist_name = appointment_request.nutritionist.name

  def use_booking_language(&)
    I18n.with_locale(appointment_request.language, &)
  end

  def recipient
    email_address_with_name(appointment_request.guest_email, appointment_request.guest_name)
  end

  def appointment_time
    starts_at, ends_at = appointment_request.values_at(:starts_at, :ends_at).map { |time| time.in_time_zone(BookingSchedule::TIME_ZONE) }
    t("appointment_request_mailer.appointment_time",
      day: I18n.l(starts_at, format: :appointment_day), starts: starts_at.strftime("%H:%M"), ends: ends_at.strftime("%H:%M"))
  end

  def appointment_place
    return t("appointment_request_mailer.online") if appointment_request.online?

    service = appointment_request.service
    "#{service.street_address}, #{service.city}"
  end
end
