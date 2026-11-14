class LocationsController < ApplicationController
  def index
    render json: { locations: Service.locations, default: NutritionistSearch::DEFAULT_LOCATION }
  end
end
