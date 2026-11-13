class AppointmentRequest < ApplicationRecord
  belongs_to :service
  belongs_to :nutritionist
end
