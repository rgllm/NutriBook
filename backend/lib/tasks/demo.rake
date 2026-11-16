namespace :demo do
  desc "Print the pending-requests demo URLs for the current database"
  task urls: :environment do
    puts DemoGuide.new
  end
end
