require "test_helper"

class NutritionistSearchTest < ActiveSupport::TestCase
  # Answers like NutritionistIndex with canned service ids, and records each call.
  class FakeIndex
    attr_reader :calls

    def initialize(ids = [], unavailable: false)
      @ids, @unavailable, @calls = ids, unavailable, []
    end

    def search(query, city: nil)
      @calls << { query:, city: }
      raise NutritionistIndex::Unavailable, "connection refused" if @unavailable

      @ids
    end
  end

  # Rua do Souto, Braga, where Mary Jane works. Ana Ferreira is in Porto.
  BRAGA = Coordinates.new(latitude: 41.5506, longitude: -8.4260)
  PORTO = Coordinates.new(latitude: 41.1504, longitude: -8.6056)

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
    index = FakeIndex.new([ other.services.first.id, services(:mary_follow_up).id, services(:mary_first_appointment).id ])

    search = search(query: " jnae ", location: "braga", index:)

    assert_equal [ other, nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 2, search.total_count
    assert_equal [ { query: "jnae", city: "Braga" } ], index.calls
  end

  test "ranked results list only the services at the searched location" do
    mary = nutritionists(:mary_jane)
    weight_loss = mary.services.create!(name: "Weight loss", price: 30, city: "Porto", street_address: "Rua de Cedofeita 9", duration_minutes: 45)

    porto = search(query: "mary", location: "Porto", index: FakeIndex.new([ weight_loss.id ])).nutritionists

    assert_equal [ "Weight loss" ], porto.first.services.map(&:name)
  end

  test "a ranked page past the end returns the last page" do
    created = 5.times.map { |i| create_nutritionist("Nutri #{i}", location: "Braga") }
    index = FakeIndex.new([ *created, nutritionists(:mary_jane) ].map { |nutritionist| nutritionist.services.first.id })

    search = search(query: "nutri", location: "Braga", page: "9", index:)

    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 2, search.page
  end

  test "an id the index still holds but PostgreSQL no longer does is left out" do
    index = FakeIndex.new([ 0, services(:mary_first_appointment).id ])

    assert_equal [ nutritionists(:mary_jane) ], search(query: "mary", location: "Braga", index:).nutritionists
  end

  test "without a query the index is not asked" do
    index = FakeIndex.new

    assert_equal [ nutritionists(:mary_jane) ], search(location: "Braga", index:).nutritionists
    assert_empty index.calls
  end

  test "when the index is unavailable the query is matched in SQL" do
    search = search(query: "jane", location: "Braga", index: FakeIndex.new(unavailable: true))

    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
    assert_equal 1, search.total_count
  end

  test "a city search reports no distances or nearest services" do
    search = search(location: "Braga")

    assert_equal [ nil, nil ], search.nutritionists.first.services.map(&:distance_km)
    assert_empty search.nearest_service_ids
  end

  test "nearby without a location searches every city, nearest first" do
    search = search(origin: PORTO)

    assert_nil search.location
    assert_equal "nearby", search.location_source
    assert_equal [ nutritionists(:ana_ferreira), nutritionists(:mary_jane) ], search.nutritionists
    assert_in_delta 0.0, search.nutritionists.first.services.first.distance_km, 0.1
    assert_in_delta 46.96, search.nutritionists.second.services.first.distance_km, 0.01

    assert_equal [ nutritionists(:mary_jane), nutritionists(:ana_ferreira) ], search(origin: BRAGA).nutritionists
  end

  test "nearby, a nutritionist appears once, ranked by their nearest practice, listing all of them nearest first" do
    mary = nutritionists(:mary_jane)
    porto = mary.services.create!(name: "Weight loss", price: 30, city: "Porto", street_address: "Rua de Cedofeita 9",
      duration_minutes: 45, latitude: 41.1534, longitude: -8.6184)

    search = search(origin: PORTO)

    assert_equal [ nutritionists(:ana_ferreira), mary ], search.nutritionists
    assert_equal [ "Rua de Cedofeita 9", "Rua do Souto 45", "Rua do Souto 45" ], search.nutritionists.second.services.map(&:street_address)
    assert_equal porto.id, search.nearest_service_ids[mary.id]
  end

  test "nearby, a service query ranks by the nearest practice offering that service" do
    mary = nutritionists(:mary_jane)
    sports = mary.services.create!(name: "Sports nutrition", price: 30, city: "Faro", street_address: "Rua de Santo António",
      duration_minutes: 45, latitude: 37.0161, longitude: -7.9332)

    search = search(query: "sports", origin: BRAGA)

    assert_equal [ nutritionists(:ana_ferreira), mary ], search.nutritionists
    assert_equal sports.id, search.nearest_service_ids[mary.id]
    assert_equal services(:ana_sports_nutrition).id, search.nearest_service_ids[nutritionists(:ana_ferreira).id]
  end

  test "nearby, a typed query keeps the index's typo tolerance" do
    index = FakeIndex.new([ services(:mary_first_appointment).id, services(:ana_sports_nutrition).id ])

    search = search(query: "sprts", origin: PORTO, index:)

    assert_equal [ nutritionists(:ana_ferreira), nutritionists(:mary_jane) ], search.nutritionists
    assert_equal [ { query: "sprts", city: nil } ], index.calls
  end

  test "nearby, a typed location stays a filter and is ordered by distance" do
    near = create_nutritionist("Zé Perto", location: "Braga", coordinates: [ 41.5513, -8.4230 ])

    search = search(location: "Braga", origin: Coordinates.new(latitude: 41.5513, longitude: -8.4229))

    assert_equal "Braga", search.location
    assert_equal [ near, nutritionists(:mary_jane) ], search.nutritionists
  end

  test "nearby, services without coordinates come last, without a distance" do
    unknown = create_nutritionist("Aaron Unknown", location: "Braga")

    search = search(origin: BRAGA)

    assert_equal [ nutritionists(:mary_jane), nutritionists(:ana_ferreira), unknown ], search.nutritionists
    assert_nil search.nutritionists.last.services.first.distance_km
  end

  test "nearby results are paged in distance order" do
    created = 5.times.map do |i|
      create_nutritionist("Nutri #{i}", location: "Braga", coordinates: [ 41.5506 + (i + 1) * 0.01, -8.4260 ])
    end

    first = search(origin: BRAGA)
    second = search(origin: BRAGA, page: "2")

    assert_equal 7, first.total_count
    assert_equal [ nutritionists(:mary_jane), *created.first(4) ], first.nutritionists
    assert_equal [ created.last, nutritionists(:ana_ferreira) ], second.nutritionists
  end

  test "the nearby query count does not grow with the number of results" do
    one = count_queries { load_page(search(origin: BRAGA)) }

    4.times { |i| create_nutritionist("Nutri #{i}", location: "Porto", coordinates: [ 41.15, -8.6 ]) }
    many = nil
    queries = count_queries { many = load_page(search(origin: BRAGA)) }

    assert_equal 5, many.size
    assert_equal one, queries
  end

  private

  def search(query: nil, location: nil, page: nil, origin: nil, index: nil)
    NutritionistSearch.new(query:, location:, page:, origin:, index:)
  end

  def create_nutritionist(name, location:, services: [ "First appointment" ], coordinates: [ nil, nil ])
    nutritionist = Nutritionist.create!(
      name:, title: "Nutritionist", license_number: "#{SecureRandom.hex(3)}N"
    )
    services.each do |service|
      nutritionist.services.create!(name: service, price: 30, city: location, street_address: "Rua Nova 1", duration_minutes: 45,
        latitude: coordinates.first, longitude: coordinates.last)
    end
    nutritionist
  end

  def load_page(search)
    search.total_pages
    search.nutritionists.each { |nutritionist| nutritionist.services.to_a }
  end
end
