require "test_helper"

class NutritionistIndexTest < ActiveSupport::TestCase
  # Stands in for Meilisearch::Client and the index it returns.
  class FakeClient
    Task = Struct.new(:error) do
      def await = self
      def failed? = !error.nil?
    end

    attr_reader :calls

    def initialize(response: nil, raises: nil, failed_task: nil)
      @response, @raises, @failed_task, @calls = response, raises, failed_task, []
    end

    def index(uid)
      @calls << [ :index, uid ]
      self
    end

    def search(query, options)
      record(:search, query, options) { @response }
    end

    def update_settings(settings) = record(:update_settings, settings) { Task.new }
    def delete_all_documents = record(:delete_all_documents) { Task.new }
    def add_documents(documents, primary_key) = record(:add_documents, documents, primary_key) { Task.new(@failed_task) }

    private

    def record(*call)
      @calls << call
      raise @raises if @raises

      yield
    end
  end

  test "documents hold each nutritionist once per city with the services there" do
    mary = nutritionists(:mary_jane)
    mary.services.create!(name: "Weight loss", price: 30, city: "Guimarães", street_address: "Rua de Santa Maria 3", duration_minutes: 45)

    documents = NutritionistIndex.documents.select { |document| document[:nutritionist_id] == mary.id }

    assert_equal [
      { id: "#{mary.id}-braga", nutritionist_id: mary.id, name: "Mary Jane", city: "Braga",
        service_names: [ "First appointment", "Follow-up" ] },
      { id: "#{mary.id}-guimaraes", nutritionist_id: mary.id, name: "Mary Jane", city: "Guimarães",
        service_names: [ "Weight loss" ] }
    ], documents
  end

  test "a search filters by city and returns the ranked ids with paging" do
    client = FakeClient.new(response: { "hits" => [ { "nutritionist_id" => 7 }, { "nutritionist_id" => 3 } ], "totalHits" => 12, "page" => 2 })

    hits = NutritionistIndex.new(client).search("jnae", city: %(Say "Braga"), page: 2, per_page: 5)

    assert_equal NutritionistIndex::Hits.new(ids: [ 7, 3 ], total: 12, page: 2), hits
    assert_equal [ :search, "jnae", {
      filter: %(city = "Say \\"Braga\\""), sort: [ "name:asc" ], attributes_to_retrieve: [ "nutritionist_id" ], page: 2, hits_per_page: 5
    } ], client.calls.last
  end

  test "client and connection errors become Unavailable" do
    [ Meilisearch::CommunicationError.new("refused"), Meilisearch::TimeoutError.new, SocketError.new("no such host"), Errno::ECONNRESET.new ].each do |error|
      index = NutritionistIndex.new(FakeClient.new(raises: error))

      assert_raises(NutritionistIndex::Unavailable, error.class.name) { index.search("jane", city: "Braga", page: 1, per_page: 5) }
    end
  end

  test "a rebuild applies the settings and replaces every document" do
    client = FakeClient.new

    count = NutritionistIndex.new(client).rebuild!

    assert_equal NutritionistIndex.documents.size, count
    assert_equal [
      [ :index, "nutritionists" ],
      [ :update_settings, NutritionistIndex::SETTINGS ],
      [ :delete_all_documents ],
      [ :add_documents, NutritionistIndex.documents, "id" ]
    ], client.calls
  end

  test "a rebuild whose task fails is reported as Unavailable" do
    index = NutritionistIndex.new(FakeClient.new(failed_task: { "code" => "invalid_document_id" }))

    error = assert_raises(NutritionistIndex::Unavailable) { index.rebuild! }
    assert_match "invalid_document_id", error.message
  end

  test "without a configured URL searches stay in SQL and refresh says so" do
    assert_nil NutritionistIndex.configured
    assert_equal "Search index not configured; searches use SQL.", NutritionistIndex.refresh
  end
end
