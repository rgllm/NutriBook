class NutritionistSearch
  DEFAULT_LOCATION = "Braga".freeze
  LOCATION_ALIASES = { "lisbon" => "Lisboa", "oporto" => "Porto" }.freeze
  PER_PAGE = 5

  attr_reader :location, :location_source

  def initialize(query:, location:, page:)
    @query = query.to_s.squish
    @requested_page = page
    @location, @location_source = resolve_location(location)
  end

  def per_page
    PER_PAGE
  end

  def total_count
    @total_count ||= matching.count
  end

  def total_pages
    [ total_count.fdiv(PER_PAGE).ceil, 1 ].max
  end

  def page
    @page ||= Integer(@requested_page.to_s, 10, exception: false).to_i.clamp(1, total_pages)
  end

  def nutritionists
    @nutritionists ||= matching.order(:name, :id).limit(PER_PAGE).offset((page - 1) * PER_PAGE).to_a.tap do |records|
      ActiveRecord::Associations::Preloader.new(
        records:, associations: :services, scope: Service.where(location:).order(:name, :id)
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
    Service.locations.index_by { |city| location_key(city) }
  end

  def location_key(value)
    ActiveSupport::Inflector.transliterate(value.to_s).downcase.squish
  end

  # A subquery keeps one row per nutritionist however many services match.
  def matching
    Nutritionist.where(id: matching_services.select(:nutritionist_id))
  end

  def matching_services
    services = Service.where(location:)
    return services if @query.empty?

    services.joins(:nutritionist).where(
      "unaccent(nutritionists.name) ILIKE unaccent(:pattern) OR unaccent(services.name) ILIKE unaccent(:pattern)",
      pattern: "%#{ActiveRecord::Base.sanitize_sql_like(@query)}%"
    )
  end
end
