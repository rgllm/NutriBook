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

  test "documents hold each service with its nutritionist's name and city" do
    documents = NutritionistIndex.documents.select { |document| document[:name] == "Mary Jane" }

    assert_equal [
      { id: services(:mary_first_appointment).id, city: "Braga", name: "Mary Jane", service_name: "First appointment" },
      { id: services(:mary_follow_up).id, city: "Braga", name: "Mary Jane", service_name: "Follow-up" }
    ].sort_by { |document| document[:id] }, documents
  end

  test "a search returns every matching service id in ranked order, in a city if given" do
    client = FakeClient.new(response: { "hits" => [ { "id" => 7 }, { "id" => 3 } ] })
    index = NutritionistIndex.new(client)

    assert_equal [ 7, 3 ], index.search("jnae", city: %(Say "Braga"))
    assert_equal [ :search, "jnae", { attributes_to_retrieve: [ "id" ], limit: 1000, filter: %(city = "Say \\"Braga\\"") } ], client.calls.last

    index.search("jnae")
    assert_equal [ :search, "jnae", { attributes_to_retrieve: [ "id" ], limit: 1000 } ], client.calls.last
  end

  test "client and connection errors become Unavailable" do
    [ Meilisearch::CommunicationError.new("refused"), Meilisearch::TimeoutError.new, SocketError.new("no such host"), Errno::ECONNRESET.new ].each do |error|
      index = NutritionistIndex.new(FakeClient.new(raises: error))

      assert_raises(NutritionistIndex::Unavailable, error.class.name) { index.search("jane", city: "Braga") }
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
