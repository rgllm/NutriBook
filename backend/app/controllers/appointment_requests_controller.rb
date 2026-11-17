class AppointmentRequestsController < ApplicationController
  # A nutritionist's pending requests, overdue ones included, soonest first.
  def index
    nutritionist = Nutritionist.find(params[:nutritionist_id])
    requests = nutritionist.appointment_requests.pending.includes(:service).order(:starts_at, :id)

    render json: {
      nutritionist: nutritionist.as_json(only: %i[id name]),
      appointment_requests: requests.as_json(
        only: %i[id guest_name guest_email starts_at ends_at online],
        include: { service: { only: %i[id name] } }
      )
    }
  end

  def create
    request = AppointmentRequest.submit(appointment_request_params)

    if request.persisted?
      render json: request.as_json(
        only: %i[id status guest_name guest_email starts_at ends_at online],
        include: { service: { only: %i[id name street_address city] } }
      ), status: :created
    else
      render json: { errors: request.error_codes }, status: :unprocessable_content
    end
  end

  # The nutritionist accepts or rejects one of their requests.
  def update
    appointment_request = AppointmentRequest.find_by!(id: params[:id], nutritionist_id: params[:nutritionist_id])
    rejected_ids = appointment_request.answer!(params.expect(appointment_request: [ :status ])[:status])

    render json: appointment_request.as_json(only: %i[id status answered_at]).merge(rejected_ids:)
  rescue AppointmentRequest::NotAnswerable => error
    render json: { error: error.message, status: appointment_request.status }, status: :conflict
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.error_codes }, status: :unprocessable_content
  end

  private

  # The guest picks a day and a time in Portugal; the model only sees starts_at.
  def appointment_request_params
    attributes = params.expect(appointment_request: %i[service_id guest_name guest_email date time online language])
    attributes.except(:date, :time).merge(starts_at: BookingSchedule.starts_at(attributes[:date], attributes[:time]))
  end
end
