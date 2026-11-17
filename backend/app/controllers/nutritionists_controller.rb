class NutritionistsController < ApplicationController
  def index
    render_search
  end

  # The same search from the guest's position. The coordinates travel in the
  # body, so they stay out of URLs, and the parameter filter keeps them out of logs.
  def nearby
    origin = Coordinates.parse(params[:latitude], params[:longitude])
    return render json: { errors: { coordinates: [ "invalid" ] } }, status: :unprocessable_content unless origin

    render_search(origin:)
  end

  private

  def render_search(origin: nil)
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
