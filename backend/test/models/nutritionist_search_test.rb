require "test_helper"

class NutritionistSearchTest < ActiveSupport::TestCase
  # Rua do Souto, Braga, where Mary Jane works, and Ana Ferreira's practice in Porto.
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

  test "an unknown location falls back to Braga" do
    search = search(location: "Atlantis")

    assert_equal "Braga", search.location
    assert_equal "fallback", search.location_source
    assert_equal [ nutritionists(:mary_jane) ], search.nutritionists
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

  test "typos match individual words without matching only a common word" do
    joao = create_nutritionist("João Gonçalves", location: "Braga", services: [ "Sports nutrition" ])
    create_nutritionist("Rui Gomes", location: "Braga", services: [ "Clinical nutrition" ])

    assert_equal [ joao ], search(query: "goncalvs").nutritionists
    assert_equal [ joao ], search(query: "sprts nutrition").nutritionists
    assert_equal services(:mary_first_appointment).id, search(query: "first appointment", origin: BRAGA).nearest_service_ids[nutritionists(:mary_jane).id]
  end

  test "exact and prefix matches precede fuzzy matches with stable ties" do
    fuzzy = create_nutritionist("A Sports specialist", location: "Braga", services: [ "Sports nutrition" ])
    prefix = create_nutritionist("Z Sports specialist", location: "Braga", services: [ "Sprts nutrition plus" ])
    exact = create_nutritionist("Z Exact specialist", location: "Braga", services: [ "Sprts nutrition" ])

    assert_equal [ exact, prefix, fuzzy ], search(query: "sprts nutrition").nutritionists
  end

  test "short words and punctuation match literally" do
    underscore = create_nutritionist("A_B", location: "Braga")

    assert_equal [ underscore ], search(query: "_").nutritionists
    assert_equal [ underscore ], search(query: "a_").nutritionists
    assert_empty search(query: "x").nutritionists
    assert_empty search(query: "sprts %").nutritionists
  end

  test "database writes refresh normalized search names without callbacks" do
    joao = create_nutritionist("Other name", location: "Braga", services: [ "Other service" ])
    joao.update_columns(name: "JOA\u0303O Gonçalves")
    joao.services.first.update_columns(name: "NUTRIÇÃO desportiva")

    assert_equal [ joao ], search(query: "joão").nutritionists
    assert_equal [ joao ], search(query: "nutricao").nutritionists
  end

  test "typed results paginate after grouping nutritionists" do
    created = 6.times.map { |i| create_nutritionist("Nutri #{i}", location: "Braga", services: [ "Sports nutrition", "Sports nutrition plus" ]) }
    result = search(query: "sports nutrition", page: "99")

    assert_equal 6, result.total_count
    assert_equal 2, result.page
    assert_equal [ created.last ], result.nutritionists
  end

  test "a city search reports no distances or nearest services" do
    search = search(location: "Braga")

    assert_equal [ nil, nil ], search.nutritionists.first.services.map(&:distance_km)
    assert_empty search.nearest_service_ids
  end

  test "a position orders the city's nutritionists nearest first, with distances" do
    near = create_nutritionist("Zé Perto", location: "Braga", coordinates: [ 41.5513, -8.4230 ])

    search = search(location: "Braga", origin: Coordinates.new(latitude: 41.5513, longitude: -8.4229))

    assert_equal "Braga", search.location
    assert_equal [ near, nutritionists(:mary_jane) ], search.nutritionists
    assert_in_delta 0.01, search.nutritionists.first.services.first.distance_km, 0.01
  end

  test "a nutritionist appears once, ranked by their nearest practice, listing all of them nearest first" do
    origin = Coordinates.new(latitude: 41.5600, longitude: -8.4000)
    mary = nutritionists(:mary_jane)
    central = mary.services.create!(name: "Weight loss", price: 30, city: "Braga", street_address: "Avenida Central 1",
      duration_minutes: 45, latitude: origin.latitude, longitude: origin.longitude)
    ze = create_nutritionist("Zé Perto", location: "Braga", coordinates: [ 41.5590, -8.4000 ])

    search = search(location: "Braga", origin:)

    assert_equal [ mary, ze ], search.nutritionists
    assert_equal [ "Avenida Central 1", "Rua do Souto 45", "Rua do Souto 45" ], search.nutritionists.first.services.map(&:street_address)
    assert_equal central.id, search.nearest_service_ids[mary.id]
  end

  test "a service query ranks by the nearest practice offering that service" do
    mary = nutritionists(:mary_jane)
    sports = mary.services.create!(name: "Sports nutrition", price: 30, city: "Braga", street_address: "Avenida da Liberdade 9",
      duration_minutes: 45, latitude: 41.6000, longitude: -8.4000)
    ze = create_nutritionist("Zé Perto", location: "Braga", services: [ "Sports nutrition" ], coordinates: [ 41.5600, -8.4260 ])

    search = search(query: "sports", location: "Braga", origin: BRAGA)

    assert_equal [ ze, mary ], search.nutritionists
    assert_equal sports.id, search.nearest_service_ids[mary.id]
  end

  test "with a position, matching stays typo tolerant and selects the matching booking service" do
    result = search(query: "sprts nutrition", location: "Porto", origin: PORTO)

    assert_equal [ nutritionists(:ana_ferreira) ], result.nutritionists
    assert_equal services(:ana_sports_nutrition).id, result.nearest_service_ids[nutritionists(:ana_ferreira).id]
  end

  test "distance takes precedence over exact query relevance" do
    mary = nutritionists(:mary_jane)
    sports = mary.services.create!(name: "Sports nutrition", price: 30, city: "Braga", street_address: "Rua do Souto 45",
      duration_minutes: 45, latitude: BRAGA.latitude, longitude: BRAGA.longitude)
    exact = create_nutritionist("Zé Exato", location: "Braga", services: [ "Sprts nutrition" ], coordinates: [ 41.6000, -8.4000 ])

    assert_equal [ exact, mary ], search(query: "sprts nutrition", location: "Braga").nutritionists

    result = search(query: "sprts nutrition", location: "Braga", origin: BRAGA)
    assert_equal [ mary, exact ], result.nutritionists
    assert_equal sports.id, result.nearest_service_ids[mary.id]
  end

  test "services without coordinates come last, without a distance" do
    unknown = create_nutritionist("Aaron Unknown", location: "Braga")

    search = search(location: "Braga", origin: BRAGA)

    assert_equal [ nutritionists(:mary_jane), unknown ], search.nutritionists
    assert_nil search.nutritionists.last.services.first.distance_km
  end

  test "results with a position are paged in distance order" do
    created = 5.times.map do |i|
      create_nutritionist("Nutri #{i}", location: "Braga", coordinates: [ 41.5506 + (i + 1) * 0.01, -8.4260 ])
    end

    first = search(location: "Braga", origin: BRAGA)
    second = search(location: "Braga", origin: BRAGA, page: "2")

    assert_equal 6, first.total_count
    assert_equal [ nutritionists(:mary_jane), *created.first(4) ], first.nutritionists
    assert_equal [ created.last ], second.nutritionists
  end

  test "the query count with a position does not grow with the number of results" do
    one = count_queries { load_page(search(location: "Braga", origin: BRAGA)) }

    4.times { |i| create_nutritionist("Nutri #{i}", location: "Braga", coordinates: [ 41.56, -8.42 ]) }
    many = nil
    queries = count_queries { many = load_page(search(location: "Braga", origin: BRAGA)) }

    assert_equal 5, many.size
    assert_equal one, queries
  end

  private

  def search(query: nil, location: nil, page: nil, origin: nil)
    NutritionistSearch.new(query:, location:, page:, origin:)
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
    search.nutritionists.each { |nutritionist| nutritionist.services.each(&:taken_slots) }
  end
end
