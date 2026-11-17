class LocationsController < ApplicationController
  def index
    render json: { locations: Service.cities, default: NutritionistSearch::DEFAULT_LOCATION }
  end

  # The searchable city closest to the browser's position.
  def nearest
    origin = Coordinates.parse(params[:latitude], params[:longitude])
    return render_invalid_coordinates unless origin

    render json: { city: City.nearest_to(origin).first!.name }
  end
end
