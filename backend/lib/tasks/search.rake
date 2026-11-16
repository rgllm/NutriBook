namespace :search do
  desc "Rebuild the Meilisearch index from PostgreSQL"
  task reindex: :environment do
    puts NutritionistIndex.refresh
  end
end
