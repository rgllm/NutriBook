class LocationsController < ApplicationController
  def index
    render json: { locations: Service.cities, default: NutritionistSearch::DEFAULT_LOCATION }
  end
end
