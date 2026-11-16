require_relative "boot"

require "rails"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "action_mailer/railtie"
require "active_job/railtie"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Nutribook
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # Solid Queue keeps jobs in the primary database (no connects_to), so a job
    # enqueued inside a transaction is inserted in that transaction: it commits
    # with the change that caused it, or rolls back with it. Deferring the
    # enqueue until after commit would reopen the gap between the two.
    config.active_job.queue_adapter = :solid_queue
    config.active_job.enqueue_after_transaction_commit = false

    # Meilisearch ranks typed searches when this is set; see NutritionistIndex.
    config.x.meilisearch_url = ENV["MEILISEARCH_URL"]
  end
end
