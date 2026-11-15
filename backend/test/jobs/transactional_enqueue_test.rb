require "test_helper"

# Solid Queue shares the primary database connection, so a job enqueued inside
# a transaction is part of it. Emails rely on this: the answer to a request and
# the job that tells the guest commit together or not at all.
class TransactionalEnqueueTest < ActiveSupport::TestCase
  class NoopJob < ApplicationJob
    def perform; end
  end

  # The real adapter, not :test, which records jobs even when the transaction
  # that enqueued them rolls back.
  def queue_adapter_for_test
    ActiveJob::QueueAdapters::SolidQueueAdapter.new
  end

  test "a job enqueued in a committed transaction is stored" do
    assert_difference -> { SolidQueue::Job.count }, 1 do
      ApplicationRecord.transaction { NoopJob.perform_later }
    end
  end

  test "a job enqueued in a rolled back transaction is discarded with it" do
    assert_no_difference -> { SolidQueue::Job.count } do
      ApplicationRecord.transaction do
        NoopJob.perform_later
        raise ActiveRecord::Rollback
      end
    end
  end
end
