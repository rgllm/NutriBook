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

  test "the slots an appointment would overlap depend on its duration, and adjacent slots stay free" do
    # Busy from 10:00 to 11:00 on a Monday in Lisbon.
    busy = [ lisbon("2026-12-07", "10:00"), lisbon("2026-12-07", "11:00") ]

    assert_equal [ lisbon("2026-12-07", "10:00") ], BookingSchedule.slots_overlapping(*busy, 30.minutes)
    assert_equal [ lisbon("2026-12-07", "10:00") ], BookingSchedule.slots_overlapping(*busy, 60.minutes)
    assert_equal [ "09:00", "10:00" ].map { |time| lisbon("2026-12-07", time) }, BookingSchedule.slots_overlapping(*busy, 90.minutes)
  end

  test "overlapped slots skip the lunch hour and follow summer time" do
    # Busy from 12:30 to 14:30 on a Monday in July, when Lisbon is UTC+1.
    busy = [ lisbon("2027-07-05", "12:30"), lisbon("2027-07-05", "14:30") ]

    assert_equal [ Time.utc(2027, 7, 5, 11), Time.utc(2027, 7, 5, 13) ], BookingSchedule.slots_overlapping(*busy, 60.minutes)
  end

  private

  def lisbon(date, time)
    BookingSchedule.starts_at(date, time)
  end

  def slot?(date, time)
    BookingSchedule.slot?(BookingSchedule.starts_at(date.iso8601, time))
  end
end
