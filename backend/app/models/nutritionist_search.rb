class NutritionistSearch
  DEFAULT_LOCATION = "Braga".freeze
  LOCATION_ALIASES = { "lisbon" => "Lisboa", "oporto" => "Porto" }.freeze
  PER_PAGE = 5

  Result = Data.define(:records, :total, :page)

  attr_reader :location, :location_source

  # The guest's position, the origin, orders results nearest first. Without a
  # typed location it also lifts the city filter, so every city takes part.
  # A typed query is matched by the search index when there is one, and by
  # PostgreSQL without one or when the index cannot answer.
  def initialize(query:, location:, page:, origin: nil, index: NutritionistIndex.configured)
    @query = query.to_s.squish
    @requested_page = Integer(page.to_s, 10, exception: false).to_i.clamp(1..)
    @origin = origin
    @index = index
    @location, @location_source = resolve_location(location)
  end

  def total_count
    result.total
  end

  def total_pages
    page_count(total_count)
  end

  def page
    result.page
  end

  def nutritionists
    @nutritionists ||= result.records.tap do |records|
      ActiveRecord::Associations::Preloader.new(records:, associations: :services, scope: listed_services).call
    end
  end

  # With an origin, the nearest service each listed nutritionist offers that
  # matches the query, keyed by nutritionist id. Booking starts from it.
  def nearest_service_ids
    @nearest_service_ids ||= @origin ? nearest_matching_services : {}
  end

  private

  def resolve_location(input)
    key = location_key(input)
    return @origin ? [ nil, "nearby" ] : [ DEFAULT_LOCATION, "default" ] if key.empty?

    city = known_locations[location_key(LOCATION_ALIASES.fetch(key, key))]
    city ? [ city, "input" ] : [ DEFAULT_LOCATION, "fallback" ]
  end

  def known_locations
    Service.cities.index_by { |city| location_key(city) }
  end

  def location_key(value)
    ActiveSupport::Inflector.transliterate(value.to_s).downcase.squish
  end

  def result
    @result ||= begin
      ids = ranked_ids
      page = @requested_page.clamp(1, page_count(ids.size))
      page_ids = ids.slice((page - 1) * PER_PAGE, PER_PAGE)
      by_id = Nutritionist.where(id: page_ids).index_by(&:id)
      Result.new(records: page_ids.filter_map { |id| by_id[id] }, total: ids.size, page:)
    end
  end

  # Every matching nutritionist's id, in result order: nearest first with an
  # origin, then the index's relevance, then name.
  def ranked_ids
    return nearest_service_ids.keys if @origin

    if indexed_ids
      nutritionist_of = matching_services.pluck(:id, :nutritionist_id).to_h
      return indexed_ids.filter_map { |id| nutritionist_of[id] }.uniq
    end

    Nutritionist.where(id: matching_services.select(:nutritionist_id)).order(:name, :id).ids
  end

  # DISTINCT ON keeps each nutritionist's nearest matching service. Services
  # without coordinates have no distance and come after the rest.
  def nearest_matching_services
    distance = @origin.distance_km_sql("services")
    nearest = matching_services
      .select("DISTINCT ON (services.nutritionist_id) services.nutritionist_id, services.id AS service_id, #{distance} AS distance_km")
      .reorder(Arel.sql("services.nutritionist_id, distance_km NULLS LAST, services.id"))

    Nutritionist.joins("JOIN (#{nearest.to_sql}) nearest ON nearest.nutritionist_id = nutritionists.id")
      .order(Arel.sql("nearest.distance_km NULLS LAST"), :name, :id)
      .pluck(:id, "nearest.service_id").to_h
  end

  # The services a query matches: by the index's ids, or by part of the
  # nutritionist's or the service's name. A name match counts every service.
  def matching_services
    services = services_in_location
    return services if @query.empty?
    return services.where(id: indexed_ids) if indexed_ids

    services.joins(:nutritionist).where(
      "unaccent(nutritionists.name) ILIKE unaccent(:pattern) OR unaccent(services.name) ILIKE unaccent(:pattern)",
      pattern: "%#{ActiveRecord::Base.sanitize_sql_like(@query)}%"
    )
  end

  # The index's matches for a typed query, or nil to match in SQL.
  def indexed_ids
    return @indexed_ids if defined?(@indexed_ids)

    @indexed_ids = (@index.search(@query, city: location) if @index && @query.present?)
  rescue NutritionistIndex::Unavailable => error
    Rails.logger.warn("Search index unavailable, matching in SQL: #{error.message}")
    @indexed_ids = nil
  end

  # Each card lists the nutritionist's services at the location, or everywhere
  # when nearby, nearest first when there is an origin.
  def listed_services
    distance = @origin ? @origin.distance_km_sql("services") : "NULL::float"
    services_in_location.select("services.*", "#{distance} AS distance_km")
      .order(Arel.sql("distance_km NULLS LAST"), :street_address, :name, :id)
  end

  # A nearby search without a location covers every city.
  def services_in_location
    location ? Service.where(city: location) : Service.all
  end

  def page_count(total)
    [ total.fdiv(PER_PAGE).ceil, 1 ].max
  end
end
