# The Meilisearch index behind typed searches. It holds one document per
# nutritionist and city, so a query only matches the services offered in the
# city being searched. PostgreSQL stays the source of truth: the index returns
# nutritionist ids in ranked order, and NutritionistSearch loads the records.
class NutritionistIndex
  UID = "nutritionists".freeze
  SETTINGS = {
    searchable_attributes: %w[name service_names],
    filterable_attributes: %w[city],
    sortable_attributes: %w[name]
  }.freeze

  Hits = Data.define(:ids, :total, :page)

  class Unavailable < StandardError; end

  # Name resolution and socket failures reach callers unwrapped by the client.
  CLIENT_ERRORS = [ Meilisearch::Error, SocketError, SystemCallError ].freeze

  # Search falls back to SQL quickly rather than hold the page for a slow engine.
  SEARCH_TIMEOUT_SECONDS = 1

  def self.configured
    url = Rails.configuration.x.meilisearch_url
    new(Meilisearch::Client.new(url, nil, timeout: SEARCH_TIMEOUT_SECONDS, max_retries: 0)) if url.present?
  end

  # Rebuilds the configured index, if any, and says what happened. Seeding and
  # booting call this, and neither should fail because the engine is away.
  def self.refresh
    index = configured
    return "Search index not configured; searches use SQL." unless index

    "Indexed #{index.rebuild!} nutritionist locations for search."
  rescue Unavailable => error
    "Search index not rebuilt; searches use SQL until it is. #{error.message}"
  end

  # One document per nutritionist and city with the names of the services there.
  # Ids follow the same accent-folding as location resolution in NutritionistSearch.
  def self.documents
    Service.joins(:nutritionist)
      .group(:nutritionist_id, :city, "nutritionists.name")
      .order(:nutritionist_id, :city)
      .pluck(:nutritionist_id, :city, "nutritionists.name", Arel.sql("array_agg(DISTINCT services.name ORDER BY services.name)"))
      .map do |nutritionist_id, city, name, service_names|
        { id: "#{nutritionist_id}-#{city.parameterize}", nutritionist_id:, name:, city:, service_names: }
      end
  end

  def initialize(client)
    @index = client.index(UID)
  end

  def search(query, city:, page:, per_page:)
    response = guard do
      @index.search(query, filter: "city = #{quote(city)}", sort: [ "name:asc" ],
        attributes_to_retrieve: [ "nutritionist_id" ], page:, hits_per_page: per_page)
    end

    Hits.new(ids: response["hits"].map { |hit| hit["nutritionist_id"] }, total: response["totalHits"], page: response["page"])
  end

  # Replaces every document. With a few hundred rows a full rebuild is simpler
  # than tracking changes, and data only changes when seeds or fixtures run.
  def rebuild!
    documents = self.class.documents

    guard do
      [ @index.update_settings(SETTINGS), @index.delete_all_documents, @index.add_documents(documents, "id") ].each do |task|
        task.await
        raise Unavailable, task.error.to_s if task.failed?
      end
    end

    documents.size
  end

  private

  def guard
    yield
  rescue *CLIENT_ERRORS => error
    raise Unavailable, error.message
  end

  def quote(value)
    %("#{value.gsub(/["\\]/) { |char| "\\#{char}" }}")
  end
end
