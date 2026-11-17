class ApplicationController < ActionController::API
  rescue_from ActionController::ParameterMissing do |error|
    render json: { error: "invalid_request", parameter: error.param.to_s }, status: :bad_request
  end

  rescue_from ActiveRecord::RecordNotFound do |error|
    render json: { error: "#{error.model} not found" }, status: :not_found
  end

  private

  def render_invalid_coordinates
    render json: { errors: { coordinates: [ "invalid" ] } }, status: :unprocessable_content
  end
end
