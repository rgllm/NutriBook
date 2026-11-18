# Demo data for trying search and the request flows right after setup.
#
# Faker runs with a fixed random seed, so every run generates the same people
# and services. Records are looked up by their natural keys before creating
# them, which keeps this file idempotent: running it twice changes nothing.
#
# Braga, the default search location, gets enough nutritionists to fill more
# than one results page.

Faker::Config.locale = "pt"
Faker::Config.random = Random.new(2026)
Faker::UniqueGenerator.clear

# How many nutritionists work in each city, and the practices they use there:
# public streets and squares, geocoded once with OpenStreetMap's Nominatim so
# distance search measures from real places. Each nutritionist takes the next
# practice in their city, and the extra practices further down take the rest.
CITIES = {
  "Braga" => [ 8, [
    [ "Praça do Município", 41.551109, -8.427750 ],
    [ "Avenida da Liberdade", 41.547733, -8.420926 ],
    [ "Rua do Souto", 41.550586, -8.426007 ],
    [ "Avenida Central", 41.551269, -8.420544 ],
    [ "Praça da República", 41.551305, -8.422970 ],
    [ "Rua de São Vicente", 41.555741, -8.421500 ],
    [ "Avenida 31 de Janeiro", 41.547380, -8.414291 ],
    [ "Rua Nova de Santa Cruz", 41.555394, -8.402895 ],
    [ "Largo do Paço", 41.550722, -8.426348 ]
  ] ],
  "Porto" => [ 5, [
    [ "Avenida dos Aliados", 41.149016, -8.610546 ],
    [ "Rua de Santa Catarina", 41.150371, -8.605576 ],
    [ "Rua de Cedofeita", 41.153385, -8.618424 ],
    [ "Praça da Batalha", 41.145485, -8.607420 ],
    [ "Avenida da Boavista", 41.160111, -8.642033 ],
    [ "Rua de Costa Cabral", 41.166554, -8.595869 ],
    [ "Praça de Mouzinho de Albuquerque", 41.157932, -8.629137 ],
    [ "Rua do Campo Alegre", 41.152593, -8.631786 ]
  ] ],
  "Lisboa" => [ 5, [
    [ "Rua Augusta", 38.711316, -9.137935 ],
    [ "Avenida de Roma", 38.749029, -9.141669 ],
    [ "Praça Duque de Saldanha", 38.733560, -9.144775 ],
    [ "Rua Garrett", 38.710821, -9.140640 ],
    [ "Avenida Almirante Reis", 38.734375, -9.134070 ]
  ] ],
  "Guimarães" => [ 3, [
    [ "Largo do Toural", 41.441906, -8.295414 ],
    [ "Avenida Conde de Margaride", 41.442735, -8.299638 ],
    [ "Rua de Santo António", 41.443331, -8.294980 ]
  ] ],
  "Coimbra" => [ 3, [
    [ "Rua Ferreira Borges", 40.208566, -8.429099 ],
    [ "Avenida Sá da Bandeira", 40.211580, -8.423996 ],
    [ "Praça da República", 40.209764, -8.419188 ]
  ] ],
  "Leiria" => [ 2, [
    [ "Praça Rodrigues Lobo", 39.744564, -8.808028 ],
    [ "Avenida Heróis de Angola", 39.745996, -8.804883 ]
  ] ],
  "Aveiro" => [ 2, [
    [ "Avenida Doutor Lourenço Peixinho", 40.642094, -8.651257 ],
    [ "Rua de João Mendonça", 40.641536, -8.654682 ]
  ] ],
  "Faro" => [ 2, [
    [ "Rua de Santo António", 37.016104, -7.933248 ],
    [ "Avenida 5 de Outubro", 37.017170, -7.928136 ]
  ] ]
}.freeze

# Name, duration in minutes, and the price range in euros.
SERVICE_CATALOG = [
  [ "First appointment", 60, 25..45 ],
  [ "Follow-up", 30, 15..30 ],
  [ "Weight loss", 45, 30..50 ],
  [ "Sports nutrition", 45, 35..60 ],
  [ "Plant-based diets", 45, 30..45 ],
  [ "Diabetes management", 60, 35..55 ],
  [ "Food intolerances", 45, 30..50 ],
  [ "Child nutrition", 45, 30..45 ],
  [ "Pregnancy nutrition", 60, 35..55 ],
  [ "Body composition analysis", 30, 15..25 ]
].freeze

def person_name
  "#{Faker::Name.first_name} #{Faker::Name.last_name}"
end

USED_NAMES = Set.new

# Names double as email local parts, so they must not repeat.
def unique_person_name
  loop do
    name = person_name
    return name if USED_NAMES.add?(name)
  end
end

def seed_service(nutritionist, catalog_entry, city:, practice:)
  name, duration, price_range = catalog_entry
  street_address, latitude, longitude = practice
  price = Faker::Number.between(from: price_range.min, to: price_range.max)

  nutritionist.services.find_or_create_by!(name:, city:, street_address:) do |service|
    service.duration_minutes = duration
    service.price = price
    service.latitude = latitude
    service.longitude = longitude
  end
end

# Filled inside the transaction and read by the summary printed after it.
nutritionists = demo_requests = nil

ActiveRecord::Base.transaction do
  CITIES.each_key { |name| City.find_or_create_by!(name:) }
  practices = CITIES.transform_values { |(_, list)| list.dup }

  nutritionists = CITIES.flat_map do |city, (count, _)|
    Array.new(count) do
      name = unique_person_name
      title = Faker::Base.sample(Nutritionist::TITLES)
      license_number = "#{Faker::Number.unique.number(digits: 4)}N"
      offers_online = Faker::Boolean.boolean(true_ratio: 0.4)
      practice = practices[city].shift
      services = SERVICE_CATALOG.first(2) + SERVICE_CATALOG.drop(2).sample(Faker::Number.between(from: 1, to: 3), random: Faker::Config.random)

      nutritionist = Nutritionist.find_or_create_by!(license_number:) do |record|
        record.name = name
        record.title = title
        record.offers_online = offers_online
      end
      services.each { |entry| seed_service(nutritionist, entry, city:, practice:) }
      nutritionist
    end
  end

  # A few Braga nutritionists also see patients in Porto, so one nutritionist
  # can match searches in two cities.
  nutritionists.first(3).each do |nutritionist|
    seed_service(nutritionist, SERVICE_CATALOG.second, city: "Porto", practice: practices["Porto"].shift)
  end

  # One Braga nutritionist works from two practices in the city, so their card
  # lists two addresses.
  seed_service(nutritionists.second, SERVICE_CATALOG.last, city: "Braga", practice: practices["Braga"].shift)

  # Pending requests for the first Braga nutritionist. The first two overlap,
  # so accepting one rejects the other automatically.
  day = BookingSchedule::TIME_ZONE.today.next_occurring(:monday)
  first_appointment = nutritionists.first.services.find_by!(name: "First appointment", city: "Braga")
  follow_up = nutritionists.first.services.find_by!(name: "Follow-up", city: "Braga")

  demo_requests = [
    [ first_appointment, day, "10:00" ],
    [ follow_up, day, "10:00" ],
    [ first_appointment, day, "14:00" ],
    [ follow_up, day + 1, "09:00" ]
  ].map do |service, date, time|
    guest_name = unique_person_name
    guest_email = "#{guest_name.parameterize(separator: ".")}@example.com"

    # Each demo guest gets one seeded request, so the email identifies it
    # whatever its status. Once answered in the app, reseeding leaves it alone.
    AppointmentRequest.find_or_create_by!(guest_email: guest_email) do |request|
      request.service = service
      request.guest_name = guest_name
      request.starts_at = BookingSchedule.starts_at(date.iso8601, time)
    end
  end
end

puts "Seeded #{Nutritionist.count} nutritionists, #{Service.count} services, " \
  "and #{AppointmentRequest.pending.count} pending requests."

# IDs move when the database is reseeded, so print where to try the
# pending-requests page. This describes the seeded scenario: answering requests
# in the app changes what the first link shows.
frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3000")
requests_url = ->(id) { "#{frontend_url}/professionals/#{id}/requests" }
booked, overlapping, *free = demo_requests.map(&:guest_name)
busy, idle = nutritionists.first(2)

puts <<~GUIDE

  Try the pending-requests page:
  - #{busy.name}, with #{demo_requests.size} seeded requests: #{requests_url.(busy.id)}
    - Accepting #{booked} also rejects #{overlapping}'s request, which overlaps it. Both cards leave and the toast reads "1 overlapping request was rejected."
    - #{free.to_sentence} don't overlap anyone, so accepting or rejecting either one removes only that card.
  - #{idle.name}, with no requests: #{requests_url.(idle.id)} shows the empty state.
  - An ID with no nutritionist: #{requests_url.([ 999_999, Nutritionist.maximum(:id) + 1 ].max)} shows the not-found page.
GUIDE
