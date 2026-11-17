class NutritionistsController < ApplicationController
  # A position orders the results nearest first; the parameter filter keeps it out of the logs.
  def index
    located = params.key?(:latitude) || params.key?(:longitude)
    origin = Coordinates.parse(params[:latitude], params[:longitude]) if located
    return render_invalid_coordinates if located && !origin

    search = NutritionistSearch.new(query: params[:q], location: params[:location], page: params[:page], origin:)

    render json: {
      nutritionists: search.nutritionists.map do |nutritionist|
        nutritionist.as_json(
          only: %i[id name title license_number offers_online],
          include: { services: { only: %i[id name price street_address city duration_minutes distance_km] } }
        ).merge("nearest_service_id" => search.nearest_service_ids[nutritionist.id])
      end,
      location: { city: search.location, source: search.location_source },
      pagination: {
        page: search.page,
        per_page: NutritionistSearch::PER_PAGE,
        total_count: search.total_count,
        total_pages: search.total_pages
      }
    }
  end
end
