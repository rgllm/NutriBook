class NutritionistSearch
  DEFAULT_LOCATION = "Braga".freeze
  LOCATION_ALIASES = { "lisbon" => "Lisboa", "oporto" => "Porto" }.freeze
  PER_PAGE = 5

  Result = Data.define(:records, :total, :page)

  attr_reader :location, :location_source

  # A typed query is ranked by the search index when there is one. Without a
  # query, or when the index cannot answer, PostgreSQL matches on its own.
  def initialize(query:, location:, page:, index: NutritionistIndex.configured)
    @query = query.to_s.squish
    @requested_page = Integer(page.to_s, 10, exception: false).to_i.clamp(1..)
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

  # The records, total, and page always come from the same path, so a fallback
  # never mixes the index's count with SQL's records.
  def result
    @result ||= ranked_result || name_ordered_result
  end

  def ranked_result
    return unless @index && @query.present?

    hits = search_index(@requested_page)
    page = @requested_page.clamp(1, page_count(hits.total))
    hits = search_index(page) unless hits.page == page

    by_id = Nutritionist.where(id: hits.ids).index_by(&:id)
    Result.new(records: hits.ids.filter_map { |id| by_id[id] }, total: hits.total, page:)
  rescue NutritionistIndex::Unavailable => error
    Rails.logger.warn("Search index unavailable, matching in SQL: #{error.message}")
    nil
  end

  def search_index(page)
    @index.search(@query, city: location, page:, per_page: PER_PAGE)
  end

  def name_ordered_result
    total = matching.count
    page = @requested_page.clamp(1, page_count(total))
    records = matching.order(:name, :id).limit(PER_PAGE).offset((page - 1) * PER_PAGE).to_a
    Result.new(records:, total:, page:)
  end

  def page_count(total)
    [ total.fdiv(PER_PAGE).ceil, 1 ].max
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
