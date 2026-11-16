# Nutritionists the e2e specs rely on, loaded after the demo seeds. They work in
# Viana do Castelo, a city the demo seeds leave empty, so a search there returns
# exactly these six. Each spec answers or books with its own nutritionist.

CITY = "Viana do Castelo"

NUTRITIONISTS = [
  [ "E2E-01", "João Gonçalves", "Nutritionist", false, "Rua Manuel Espregueira, 12",
    [ [ "First appointment", 60, 40 ], [ "Sports nutrition", 45, 50 ] ] ],
  [ "E2E-02", "Inês Araújo", "Dietitian", true, "Avenida dos Combatentes, 80",
    [ [ "First appointment", 60, 35 ], [ "Follow-up", 30, 20 ] ] ],
  [ "E2E-03", "Rui Peixoto", "Dietitian", false, "Praça da República, 5",
    [ [ "First appointment", 60, 35 ], [ "Follow-up", 30, 20 ], [ "Extended assessment", 90, 60 ] ] ],
  [ "E2E-04", "Marta Simões", "Nutritionist", false, "Rua da Bandeira, 140",
    [ [ "First appointment", 60, 30 ] ] ],
  [ "E2E-05", "Tiago Brandão", "Nutritionist", false, "Largo do Instituto Histórico, 3",
    [ [ "First appointment", 60, 30 ] ] ],
  [ "E2E-06", "Sofia Leal", "Dietitian", false, "Rua Cândido dos Reis, 27",
    [ [ "First appointment", 60, 45 ] ] ]
].freeze

ActiveRecord::Base.transaction do
  City.find_or_create_by!(name: CITY) do |city|
    city.latitude = 41.693200
    city.longitude = -8.832900
  end

  NUTRITIONISTS.each do |license_number, name, title, offers_online, street_address, services|
    nutritionist = Nutritionist.find_or_create_by!(license_number:) do |record|
      record.name = name
      record.title = title
      record.offers_online = offers_online
    end

    services.each do |service_name, duration_minutes, price|
      nutritionist.services.find_or_create_by!(name: service_name, city: CITY, street_address:) do |service|
        service.duration_minutes = duration_minutes
        service.price = price
      end
    end
  end
end

puts "Loaded #{NUTRITIONISTS.size} e2e nutritionists in #{CITY}."
