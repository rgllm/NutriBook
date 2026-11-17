class NutritionistSearch
  DEFAULT_LOCATION = "Braga".freeze
  PER_PAGE = 5

  Result = Data.define(:records, :total, :page)

  attr_reader :location, :location_source

  # The guest's position, the origin, orders results nearest first.
  def initialize(query:, location:, page:, origin: nil)
    @query = query.to_s.unicode_normalize(:nfc).downcase.tr("áàâãäåéèêëíìîïóòôõöúùûüçñýÿ", "aaaaaaeeeeiiiiooooouuuucnyy").squish
    @requested_page = Integer(page.to_s, 10, exception: false).to_i.clamp(1..)
    @origin = origin
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
    return [ DEFAULT_LOCATION, "default" ] if key.empty?

    city = known_locations[key]
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

  def ranked_ids
    return nearest_service_ids.keys if @origin

    matches = matching_services.joins(:nutritionist)
    if @query.empty?
      matches.distinct.order("nutritionists.name", "nutritionists.id").pluck("nutritionists.name", "nutritionists.id").map(&:last)
    else
      matches.group("nutritionists.id", "nutritionists.name")
        .order(Arel.sql("MIN(#{match_priority})"), Arel.sql("MAX(#{similarity}) DESC"), "nutritionists.name", "nutritionists.id")
        .pluck("nutritionists.id")
    end
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

  def matching_services
    @matching_services ||= begin
      services = services_in_location
      if @query.empty?
        services
      else
        services.where(id: matching_names(services).select(:id))
          .or(services.where(nutritionist_id: matching_names(Nutritionist.all).select(:id)))
      end
    end
  end

  def matching_names(relation)
    @query.split.reduce(relation) do |scope, word|
      predicate = "search_name LIKE :pattern"
      predicate += " OR search_name %> :word" if word.length >= 3 && word.match?(/\A[[:alnum:]]+\z/)
      scope.where(predicate, pattern: "%#{ActiveRecord::Base.sanitize_sql_like(word)}%", word:)
    end
  end

  def match_priority
    ActiveRecord::Base.sanitize_sql_array([
      "CASE WHEN nutritionists.search_name = :query OR services.search_name = :query THEN 0 " \
        "WHEN nutritionists.search_name LIKE :prefix OR services.search_name LIKE :prefix THEN 1 ELSE 2 END",
      { query: @query, prefix: "#{ActiveRecord::Base.sanitize_sql_like(@query)}%" }
    ])
  end

  def similarity
    ActiveRecord::Base.sanitize_sql_array([
      "GREATEST(word_similarity(:query, nutritionists.search_name), word_similarity(:query, services.search_name))",
      { query: @query }
    ])
  end

  # Each card lists the nutritionist's services at the location, nearest first
  # when there is an origin.
  def listed_services
    distance = @origin ? @origin.distance_km_sql("services") : "NULL::float"
    services_in_location.select("services.*", "#{distance} AS distance_km")
      .order(Arel.sql("distance_km NULLS LAST"), :street_address, :name, :id)
  end

  def services_in_location
    Service.where(city: location)
  end

  def page_count(total)
    [ total.fdiv(PER_PAGE).ceil, 1 ].max
  end
end
