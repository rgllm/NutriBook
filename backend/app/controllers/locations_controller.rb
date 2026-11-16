class LocationsController < ApplicationController
  def index
    render json: { locations: Service.cities, default: NutritionistSearch::DEFAULT_LOCATION }
  end

  # The searchable city closest to the browser's position.
  def nearest
    latitude = Float(params[:latitude], exception: false)
    longitude = Float(params[:longitude], exception: false)

    unless latitude&.between?(-90, 90) && longitude&.between?(-180, 180)
      return render json: { errors: { coordinates: [ "invalid" ] } }, status: :unprocessable_content
    end

    render json: { city: City.nearest_to(latitude:, longitude:).first!.name }
  end
end
