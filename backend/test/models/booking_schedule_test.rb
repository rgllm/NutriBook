require "test_helper"

class BookingScheduleTest < ActiveSupport::TestCase
  test "reads the day and time as Portuguese wall-clock time" do
    assert_equal Time.utc(2026, 12, 7, 10, 0), BookingSchedule.starts_at("2026-12-07", "10:00")
    assert_equal Time.utc(2027, 7, 5, 9, 0), BookingSchedule.starts_at("2027-07-05", "10:00")
  end

  test "a missing or malformed day or time gives no start" do
    [
      [ nil, "10:00" ], [ "2026-12-07", nil ], [ "07/12/2026", "10:00" ],
      [ "2026-02-30", "10:00" ], [ "2026-12-07", "10h" ], [ "2026-12-07", "25:00" ]
    ].each do |date, time|
      assert_nil BookingSchedule.starts_at(date, time), [ date, time ].inspect
    end
  end

  test "slots are on the hour, Monday to Saturday, from 9:00 to 18:00 without 13:00" do
    monday = Date.new(2026, 12, 7)
    open_hours = BookingSchedule::SLOT_HOURS.map { |hour| format("%02d:00", hour) }

    open_hours.each { |time| assert slot?(monday, time), time }
    assert slot?(monday + 5, "10:00"), "Saturday"
    assert_not slot?(monday + 6, "10:00"), "Sunday"
    [ "08:00", "13:00", "19:00", "10:30" ].each { |time| assert_not slot?(monday, time), time }
  end

  private

  def slot?(date, time)
    BookingSchedule.slot?(BookingSchedule.starts_at(date.iso8601, time))
  end
end
