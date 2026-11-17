require "test_helper"

class NutritionistSearchTest < ActiveSupport::TestCase
  # Answers like NutritionistIndex from canned pages of ids, and records each call.
  class FakeIndex
    attr_reader :calls

    def initialize(pages = {}, total: pages.values.sum(&:size), unavailable_pages: [])
      @pages, @total, @unavailable_pages, @calls = pages, total, unavailable_pages, []
    end

    def search(query, city:, page:, per_page:)
      @calls << { query:, city:, page:, per_page: }
      raise NutritionistIndex::Unavailable, "connection refused" if @unavailable_pages.include?(page)

      NutritionistIndex::Hits.new(ids: @pages.fetch(page, []), total: @total, page:)
    end
  end

  test "a blank location defaults to Braga" do
    [ nil, "", "   " ].each do |input|
      search = search(location: input)

      assert_equal "Braga", search.location
      assert_equal "default", search.location_source
    end
  end

  test "a known location resolves to that city" do
    search = search(location: "Porto")

    assert_equal "Porto", search.location
    assert_equal "input", search.location_source
  end

  test "location matching ignores case, accents and surrounding spaces" do
    create_nutritionist("Rui Costa", location: "Guimarães")

    [ "guimaraes", " GUIMARÃES ", "Guimarães" ].each do |input|
      search = search(location: input)

      assert_equal "Guimarães", search.location
      assert_equal "input", search.location_source
    end
  end

  test "English city names resolve through the alias table" do
    create_nutritionist("Inês Lima", location: "Lisboa")

    assert_equal "Lisboa", search(location: "Lisbon").location
    assert_equal "Porto", search(location: "oporto").location
    assert_equal "input", search(location: "oporto").location_source
  end

  test "an unknown location falls back to Braga" do
    search = search(location: "Atlantis")

    assert_equal "Braga", search.location
    assert_equal "fallback", search.location_source
    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
  end

  test "an alias for a city nobody works in falls back to Braga" do
    search = search(location: "Lisbon")

    assert_equal "Braga", search.location
    assert_equal "fallback", search.location_source
  end

  test "without a query it lists everyone with a service at the location" do
    assert_equal [ nutritionists(:mary_jane) ], search(location: "Braga").nutritionists
    assert_equal [ nutritionists(:ana_ferreira) ], search(location: "Porto").nutritionists
  end

  test "the query matches the nutritionist name" do
    assert_equal [ nutritionists(:mary_jane) ], search(query: "jane", location: "Braga").nutritionists
  end

  test "the query matches a service name at the location" do
    assert_equal [ nutritionists(:mary_jane) ], search(query: "FOLLOW", location: "Braga").nutritionists
    assert_equal [ nutritionists(:ana_ferreira) ], search(query: "sports", location: "Porto").nutritionists
  end

  test "a match outside the location does not count" do
    assert_empty search(query: "sports", location: "Braga").nutritionists
    assert_empty search(query: "ana", location: "Braga").nutritionists
  end

  test "the query ignores accents on either side" do
    joao = create_nutritionist("João Martins", location: "Braga", services: [ "Nutrição desportiva" ])

    assert_equal [ joao ], search(query: "joao", location: "Braga").nutritionists
    assert_equal [ joao ], search(query: "JOÃO", location: "Braga").nutritionists
    assert_equal [ joao ], search(query: "nutricao", location: "Braga").nutritionists
  end

  test "LIKE wildcards in the query are matched literally" do
    create_nutritionist("Clara Dias", location: "Braga", services: [ "Low carb" ])
    percent = create_nutritionist("Nutri 100%", location: "Braga")

    assert_equal [ percent ], search(query: "%", location: "Braga").nutritionists
    assert_empty search(query: "w_c", location: "Braga").nutritionists
  end

  test "a nutritionist in two cities shows only the services at the searched location" do
    mary = nutritionists(:mary_jane)
    mary.services.create!(name: "Weight loss", price: 30, city: "Porto", street_address: "Rua de Cedofeita 9", duration_minutes: 45)

    porto = search(location: "Porto").nutritionists
    assert_equal [ "Ana Ferreira", "Mary Jane" ], porto.map(&:name)
    assert_equal [ "Weight loss" ], porto.find { |n| n == mary }.services.map(&:name)

    braga = search(location: "Braga").nutritionists
    assert_equal [ "First appointment", "Follow-up" ], braga.first.services.map(&:name)
  end

  test "services at the location are grouped by street address, then ordered by name" do
    mary = nutritionists(:mary_jane)
    mary.services.create!(name: "Body composition analysis", price: 20, city: "Braga", street_address: "Avenida da Liberdade 10", duration_minutes: 30)

    services = search(location: "Braga").nutritionists.first.services

    assert_equal [ "Avenida da Liberdade 10", "Rua do Souto 45", "Rua do Souto 45" ], services.map(&:street_address)
    assert_equal [ "Body composition analysis", "First appointment", "Follow-up" ], services.map(&:name)
  end

  test "a nutritionist matching on several services appears once" do
    search = search(query: "f", location: "Braga")

    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 1, search.total_count
  end

  test "results are paged five at a time in a stable name order" do
    created = [ "Nutri A", "Nutri B", "Nutri B", "Nutri C", "Nutri D", "Nutri E" ].map do |name|
      create_nutritionist(name, location: "Braga")
    end
    expected = [ nutritionists(:mary_jane), *created ]

    first = search(location: "Braga", page: "1")
    second = search(location: "Braga", page: "2")

    assert_equal 7, first.total_count
    assert_equal 2, first.total_pages
    assert_equal expected.first(5), first.nutritionists
    assert_equal expected.last(2), second.nutritionists
    assert_equal 2, second.page
  end

  test "a page past the end clamps to the last page" do
    6.times { |i| create_nutritionist("Nutri #{i}", location: "Braga") }

    search = search(location: "Braga", page: "99")

    assert_equal 2, search.page
    assert_equal 2, search.nutritionists.size
  end

  test "a missing or invalid page is the first page" do
    [ nil, "", "abc", "0", "-3", "1.5" ].each do |input|
      assert_equal 1, search(location: "Braga", page: input).page, "page #{input.inspect}"
    end
  end

  test "no results is a single empty first page" do
    search = search(query: "nobody", location: "Braga", page: "3")

    assert_empty search.nutritionists
    assert_equal 0, search.total_count
    assert_equal 1, search.total_pages
    assert_equal 1, search.page
  end

  test "the query count does not grow with the number of results" do
    one = count_queries { load_page(search(location: "Porto")) }

    4.times { |i| create_nutritionist("Nutri #{i}", location: "Porto", services: [ "First appointment", "Follow-up" ]) }
    many = nil
    queries = count_queries { many = load_page(search(location: "Porto")) }

    assert_equal 5, many.size
    assert_equal one, queries
  end

  test "a typed query is ranked by the search index in the resolved city" do
    other = create_nutritionist("Ana Jane", location: "Braga")
    index = FakeIndex.new({ 1 => [ other.id, nutritionists(:mary_jane).id ] })

    search = search(query: " jnae ", location: "braga", index:)

    assert_equal [ other, nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 2, search.total_count
    assert_equal [ { query: "jnae", city: "Braga", page: 1, per_page: 5 } ], index.calls
  end

  test "ranked results list only the services at the searched location" do
    mary = nutritionists(:mary_jane)
    mary.services.create!(name: "Weight loss", price: 30, city: "Porto", street_address: "Rua de Cedofeita 9", duration_minutes: 45)

    porto = search(query: "mary", location: "Porto", index: FakeIndex.new({ 1 => [ mary.id ] })).nutritionists

    assert_equal [ "Weight loss" ], porto.first.services.map(&:name)
  end

  test "a ranked page past the end asks the index for the last page" do
    index = FakeIndex.new({ 2 => [ nutritionists(:mary_jane).id ] }, total: 6)

    search = search(query: "nutri", location: "Braga", page: "9", index:)

    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 2, search.page
    assert_equal [ 9, 2 ], index.calls.pluck(:page)
  end

  test "when the index fails on the last page the SQL match sets its own count and page" do
    index = FakeIndex.new({ 2 => [ nutritionists(:mary_jane).id ] }, total: 6, unavailable_pages: [ 2 ])

    search = search(query: "jane", location: "Braga", page: "9", index:)

    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 1, search.total_count
    assert_equal 1, search.page
    assert_equal 1, search.total_pages
  end

  test "an id the index still holds but PostgreSQL no longer does is left out" do
    index = FakeIndex.new({ 1 => [ 0, nutritionists(:mary_jane).id ] })

    assert_equal [ nutritionists(:mary_jane) ], search(query: "mary", location: "Braga", index:).nutritionists
  end

  test "without a query the index is not asked" do
    index = FakeIndex.new

    assert_equal [ nutritionists(:mary_jane) ], search(location: "Braga", index:).nutritionists
    assert_empty index.calls
  end

  test "when the index is unavailable the query is matched in SQL" do
    search = search(query: "jane", location: "Braga", index: FakeIndex.new(unavailable_pages: [ 1 ]))

    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 1, search.total_count
  end

  private

  def search(query: nil, location: nil, page: nil, index: nil)
    NutritionistSearch.new(query:, location:, page:, index:)
  end

  def create_nutritionist(name, location:, services: [ "First appointment" ])
    nutritionist = Nutritionist.create!(
      name:, title: "Nutritionist", license_number: "#{SecureRandom.hex(3)}N"
    )
    services.each do |service|
      nutritionist.services.create!(name: service, price: 30, city: location, street_address: "Rua Nova 1", duration_minutes: 45)
    end
    nutritionist
  end

  def load_page(search)
    search.total_pages
    search.nutritionists.each { |nutritionist| nutritionist.services.to_a }
  end
end
