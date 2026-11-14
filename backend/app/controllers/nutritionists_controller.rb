class NutritionistsController < ApplicationController
  def index
    search = NutritionistSearch.new(query: params[:q], location: params[:location], page: params[:page])

    render json: {
      nutritionists: search.nutritionists.as_json(
        only: %i[id slug name title license_number address offers_online],
        include: { services: { only: %i[id name price location duration_minutes] } }
      ),
      location: { city: search.location, source: search.location_source },
      pagination: {
        page: search.page,
        per_page: search.per_page,
        total_count: search.total_count,
        total_pages: search.total_pages
      }
    }
  end
end
