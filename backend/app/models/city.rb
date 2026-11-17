class City < ApplicationRecord
  has_many :services, foreign_key: :city, primary_key: :name, inverse_of: false, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
end
