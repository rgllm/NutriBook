# Opening hours for appointments, in Portuguese wall-clock time. Guests pick a
# day and one of the hourly slots; times are stored in UTC.
class BookingSchedule
  TIME_ZONE = ActiveSupport::TimeZone["Europe/Lisbon"]
  OPEN_WEEKDAYS = (1..6).freeze # Monday to Saturday
  SLOT_HOURS = [ 9, 10, 11, 12, 14, 15, 16, 17, 18 ].freeze

  # "2026-11-23" and "10:00" become that wall-clock time in Portugal, or nil
  # when either part is missing or malformed.
  def self.starts_at(date, time)
    day = Date.iso8601(date.to_s)
    hour, minute = time.to_s.match(/\A(\d{2}):(\d{2})\z/)&.captures&.map(&:to_i)
    TIME_ZONE.local(day.year, day.month, day.day, hour, minute) if hour
  rescue Date::Error, ArgumentError
    nil
  end

  def self.slot?(time)
    local = time.in_time_zone(TIME_ZONE)
    OPEN_WEEKDAYS.include?(local.wday) && SLOT_HOURS.include?(local.hour) && local.min.zero? && local.sec.zero?
  end
end
