class NutritionistSearch
  DEFAULT_LOCATION = "Braga".freeze
  LOCATION_ALIASES = { "lisbon" => "Lisboa", "oporto" => "Porto" }.freeze
  PER_PAGE = 5

  attr_reader :location, :location_source

  # A typed query is ranked by the search index when there is one. Without a
  # query, or when the index cannot answer, PostgreSQL matches on its own.
  def initialize(query:, location:, page:, index: NutritionistIndex.configured)
    @query = query.to_s.squish
    @requested_page = Integer(page.to_s, 10, exception: false).to_i.clamp(1..)
    @index = index
    @location, @location_source = resolve_location(location)
  end

  def per_page
    PER_PAGE
  end

  def total_count
    @total_count ||= index_hits&.total || matching.count
  end

  def total_pages
    [ total_count.fdiv(PER_PAGE).ceil, 1 ].max
  end

  def page
    @page ||= @requested_page.clamp(1, total_pages)
  end

  def nutritionists
    @nutritionists ||= (index_hits ? ranked_page : name_ordered_page).tap do |records|
      ActiveRecord::Associations::Preloader.new(
        records:, associations: :services, scope: Service.where(city: location).order(:street_address, :name, :id)
      ).call
    end
  end

  private

  def resolve_location(input)
    key = location_key(input)
    return [ DEFAULT_LOCATION, "default" ] if key.empty?

    city = known_locations[location_key(LOCATION_ALIASES.fetch(key, key))]
    city ? [ city, "input" ] : [ DEFAULT_LOCATION, "fallback" ]
  end

  def known_locations
    Service.cities.index_by { |city| location_key(city) }
  end

  def location_key(value)
    ActiveSupport::Inflector.transliterate(value.to_s).downcase.squish
  end

  def index_hits
    return @index_hits if defined?(@index_hits)

    @index_hits = (search_index(@requested_page) if @index && @query.present?)
  rescue NutritionistIndex::Unavailable => error
    Rails.logger.warn("Search index unavailable, matching in SQL: #{error.message}")
    @index_hits = nil
  end

  # A page past the end asks the index again for the last page.
  def ranked_page
    hits = index_hits.page == page ? index_hits : search_index(page)
    by_id = Nutritionist.where(id: hits.ids).index_by(&:id)
    hits.ids.filter_map { |id| by_id[id] }
  rescue NutritionistIndex::Unavailable
    name_ordered_page
  end

  def search_index(page)
    @index.search(@query, city: location, page:, per_page: PER_PAGE)
  end

  def name_ordered_page
    matching.order(:name, :id).limit(PER_PAGE).offset((page - 1) * PER_PAGE).to_a
  end

  # A subquery keeps one row per nutritionist however many services match.
  def matching
    Nutritionist.where(id: matching_services.select(:nutritionist_id))
  end

  def matching_services
    services = Service.where(city: location)
    return services if @query.empty?

    services.joins(:nutritionist).where(
      "unaccent(nutritionists.name) ILIKE unaccent(:pattern) OR unaccent(services.name) ILIKE unaccent(:pattern)",
      pattern: "%#{ActiveRecord::Base.sanitize_sql_like(@query)}%"
    )
  end
end
