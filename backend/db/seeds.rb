# Demo data for trying search and the request flows right after setup.
#
# Faker runs with a fixed random seed, so every run generates the same people
# and services. Records are looked up by their natural keys before creating
# them. Reruns preserve existing data except overdue pending demo dates.
#
# Braga, the default search location, gets enough nutritionists to fill more
# than one results page.

Faker::Config.locale = "pt"
Faker::Config.random = Random.new(2026)
Faker::UniqueGenerator.clear

# Each city's centre, which "use my location" measures from, and how many
# nutritionists work there.
CITIES = {
  "Braga" => [ 41.545400, -8.426500, 8 ],
  "Porto" => [ 41.157900, -8.629100, 5 ],
  "Lisboa" => [ 38.722300, -9.139300, 5 ],
  "Guimarães" => [ 41.442500, -8.291800, 3 ],
  "Coimbra" => [ 40.203300, -8.410300, 3 ],
  "Leiria" => [ 39.743600, -8.807100, 2 ],
  "Aveiro" => [ 40.640500, -8.653800, 2 ],
  "Faro" => [ 37.019400, -7.932200, 2 ]
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

STREET_TYPES = %w[Rua Avenida Praça Largo Travessa].freeze

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

def street_address
  "#{STREET_TYPES.sample(random: Faker::Config.random)} #{person_name}, #{Faker::Number.between(from: 1, to: 300)}"
end

def seed_service(nutritionist, catalog_entry, city:, street_address:)
  name, duration, price_range = catalog_entry
  price = Faker::Number.between(from: price_range.min, to: price_range.max)

  nutritionist.services.find_or_create_by!(name:, city:, street_address:) do |service|
    service.duration_minutes = duration
    service.price = price
  end
end

# Filled inside the transaction and read by the summary printed after it.
nutritionists = demo_requests = nil

ActiveRecord::Base.transaction do
  CITIES.each do |name, (latitude, longitude, _)|
    City.find_or_create_by!(name:) do |city|
      city.latitude = latitude
      city.longitude = longitude
    end
  end

  nutritionists = CITIES.flat_map do |city, (_, _, count)|
    Array.new(count) do
      name = unique_person_name
      title = Faker::Base.sample(Nutritionist::TITLES)
      license_number = "#{Faker::Number.unique.number(digits: 4)}N"
      offers_online = Faker::Boolean.boolean(true_ratio: 0.4)
      address = street_address
      services = SERVICE_CATALOG.first(2) + SERVICE_CATALOG.drop(2).sample(Faker::Number.between(from: 1, to: 3), random: Faker::Config.random)

      nutritionist = Nutritionist.find_or_create_by!(license_number:) do |record|
        record.name = name
        record.title = title
        record.offers_online = offers_online
      end
      services.each { |entry| seed_service(nutritionist, entry, city:, street_address: address) }
      nutritionist
    end
  end

  # A few Braga nutritionists also see patients in Porto, so one nutritionist
  # can match searches in two cities.
  nutritionists.first(3).each do |nutritionist|
    seed_service(nutritionist, SERVICE_CATALOG.second, city: "Porto", street_address: street_address)
  end

  # One Braga nutritionist works from two practices in the city, so their card
  # lists two addresses.
  seed_service(nutritionists.second, SERVICE_CATALOG.last, city: "Braga", street_address: street_address)

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
    request = AppointmentRequest.find_or_create_by!(guest_email: guest_email) do |record|
      record.service = service
      record.guest_name = guest_name
      record.starts_at = BookingSchedule.starts_at(date.iso8601, time)
    end
    request.with_lock do
      if request.pending? && request.starts_at <= Time.current && request.service_id == service.id && request.guest_name == guest_name
        request.update!(starts_at: BookingSchedule.starts_at(date.iso8601, time))
      end
    end
    request
  end
end

puts "Seeded #{Nutritionist.count} nutritionists, #{Service.count} services, " \
  "and #{AppointmentRequest.pending.count} pending requests."
puts NutritionistIndex.refresh

# Print current records because answering requests changes the demo scenario.
frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3000")
requests_url = ->(id) { "#{frontend_url}/nutritionists/#{id}/requests" }
busy, idle = nutritionists.first(2)
pending_demo = demo_requests.select(&:pending?)
booked, overlapping = demo_requests.first(2)

puts "\nTry the pending-requests page:"
puts "- #{busy.name}, with #{pending_demo.size} pending demo #{"request".pluralize(pending_demo.size)}: #{requests_url.(busy.id)}"
demo_requests.each do |request|
  local_start = request.starts_at.in_time_zone(BookingSchedule::TIME_ZONE).strftime("%Y-%m-%d %H:%M")
  puts "  - #{request.guest_name}: #{request.status}, #{local_start} (Europe/Lisbon)."
end
if booked.pending? && overlapping.pending? && booked.starts_at < overlapping.ends_at && booked.ends_at > overlapping.starts_at
  puts "  - Accepting #{booked.guest_name} also rejects #{overlapping.guest_name}'s request, which overlaps it."
end
idle_count = idle.appointment_requests.pending.count
puts "- #{idle.name}, with #{idle_count} pending #{"request".pluralize(idle_count)}: #{requests_url.(idle.id)}#{' shows the empty state.' if idle_count.zero?}"
puts "- An ID with no nutritionist: #{requests_url.([ 999_999, Nutritionist.maximum(:id) + 1 ].max)} shows the 404 page."
puts "- A malformed ID: #{requests_url.("1abc")} returns a real 404."
