# Opening hours for appointments, in Portuguese wall-clock time. Guests pick a
# day and one of the half-hourly slots; times are stored in UTC.
class BookingSchedule
  TIME_ZONE = ActiveSupport::TimeZone["Europe/Lisbon"]
  OPEN_WEEKDAYS = (1..6).freeze # Monday to Saturday
  SLOT_TIMES = %w[
    09:00 09:30 10:00 10:30 11:00 11:30 12:00 12:30
    14:00 14:30 15:00 15:30 16:00 16:30 17:00 17:30 18:00
  ].freeze

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
    OPEN_WEEKDAYS.include?(local.wday) && SLOT_TIMES.include?(local.strftime("%H:%M")) && local.sec.zero?
  end

  # The slots where an appointment lasting `duration` would overlap the busy
  # interval [starts_at, ends_at). A slot that ends as it starts, or starts as
  # it ends, is free. Lisbon's offsets are whole hours, so stepping by half an
  # hour in UTC from the top of an hour visits every slot.
  def self.slots_overlapping(starts_at, ends_at, duration)
    earliest = starts_at - duration
    (earliest.beginning_of_hour.to_i...ends_at.to_i).step(30.minutes.to_i).filter_map do |seconds|
      start = Time.zone.at(seconds)
      start if start > earliest && slot?(start)
    end
  end
end
