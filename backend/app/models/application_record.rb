class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  # Each attribute's validation errors as codes, such as { starts_at: [:past] }.
  # The API sends these and the frontend words them in the guest's language.
  def error_codes = errors.details.transform_values { |details| details.pluck(:error) }
end
