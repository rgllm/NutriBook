# The Meilisearch index behind typed searches. It holds one document per
# service, with its nutritionist's name, so a query says which services match
# and where. PostgreSQL stays the source of truth: the index returns service
# ids in ranked order, and NutritionistSearch groups, orders, and pages them.
class NutritionistIndex
  UID = "nutritionists".freeze
  SETTINGS = {
    searchable_attributes: %w[name service_name],
    filterable_attributes: %w[city]
  }.freeze

  # Meilisearch's default pagination.maxTotalHits. Every match is fetched at
  # once, which holds while the catalogue has fewer services than this.
  MAX_HITS = 1000

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

    "Indexed #{index.rebuild!} services for search."
  rescue Unavailable => error
    "Search index not rebuilt; searches use SQL until it is. #{error.message}"
  end

  def self.documents
    Service.joins(:nutritionist).order(:id)
      .pluck(:id, :city, "nutritionists.name", :name)
      .map { |id, city, name, service_name| { id:, city:, name:, service_name: } }
  end

  def initialize(client)
    @index = client.index(UID)
  end

  # The ids of the services matching the query, most relevant first. A city
  # limits them to the services there.
  def search(query, city: nil)
    options = { attributes_to_retrieve: [ "id" ], limit: MAX_HITS }
    options[:filter] = "city = #{quote(city)}" if city
    guard { @index.search(query, options) }["hits"].map { |hit| hit["id"] }
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
