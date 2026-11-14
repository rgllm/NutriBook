class LocationsController < ApplicationController
  def index
    render json: { locations: Service.locations }
  end
end
