class AppointmentRequestsController < ApplicationController
  def create
    request = AppointmentRequest.submit(appointment_request_params)

    if request.persisted?
      render json: request.as_json(
        only: %i[id status guest_name guest_email starts_at ends_at online],
        include: { service: { only: %i[id name street_address city] } }
      ), status: :created
    else
      render json: { errors: request.errors.to_hash }, status: :unprocessable_content
    end
  end

  private

  # The guest picks a day and a time in Portugal; the model only sees starts_at.
  def appointment_request_params
    attributes = params.expect(appointment_request: %i[service_id guest_name guest_email date time online])
    attributes.except(:date, :time).merge(starts_at: BookingSchedule.starts_at(attributes[:date], attributes[:time]))
  end
end
