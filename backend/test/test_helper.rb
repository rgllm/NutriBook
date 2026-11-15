ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    include ActiveJob::TestHelper

    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Counts the SQL statements a block runs, leaving out schema lookups and
    # transaction bookkeeping.
    def count_queries(&block)
      count = 0
      counter = ->(*, payload) { count += 1 unless payload[:name].in?([ "SCHEMA", "TRANSACTION" ]) }
      ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &block)
      count
    end

    # Waits until another connection is blocked on a lock, so a race test knows
    # its second actor reached the contended point.
    def wait_until_blocked_on_a_lock
      50.times do
        blocked = ActiveRecord::Base.uncached do
          ActiveRecord::Base.connection.select_value(<<~SQL)
            SELECT count(*) FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'
          SQL
        end
        return if blocked.positive?

        sleep 0.05
      end
      flunk "the second actor never waited for the first"
    end
  end
end

module ActionDispatch
  class IntegrationTest
    include Committee::Rails::Test::Methods

    def committee_options
      { schema_path: Rails.root.join("public/openapi.yaml").to_s, strict_reference_validation: true }
    end
  end
end
