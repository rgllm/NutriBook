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

  test "slots start every half hour, Monday to Saturday, from 09:00 to 18:00 without the lunch hour" do
    every_quarter_hour = (0...24 * 60).step(15).map { |minutes| format("%02d:%02d", *minutes.divmod(60)) }
    open_times = %w[
      09:00 09:30 10:00 10:30 11:00 11:30 12:00 12:30
      14:00 14:30 15:00 15:30 16:00 16:30 17:00 17:30 18:00
    ]

    [ Date.new(2026, 12, 7), Date.new(2027, 7, 5) ].each do |monday|
      assert_equal open_times, every_quarter_hour.select { |time| slot?(monday, time) }, monday
      assert slot?(monday + 5, "10:30"), "Saturday"
      assert_not slot?(monday + 6, "10:30"), "Sunday"
    end
    assert_not BookingSchedule.slot?(lisbon("2026-12-07", "10:30") + 1.second), "a second past the slot"
  end

  test "the slots an appointment would overlap depend on its duration, and adjacent slots stay free" do
    # Busy from 10:00 to 11:00 on a Monday in Lisbon.
    busy = [ lisbon("2026-12-07", "10:00"), lisbon("2026-12-07", "11:00") ]

    {
      30 => %w[10:00 10:30],
      45 => %w[09:30 10:00 10:30],
      60 => %w[09:30 10:00 10:30],
      90 => %w[09:00 09:30 10:00 10:30]
    }.each do |minutes, times|
      assert_equal times.map { |time| lisbon("2026-12-07", time) }, BookingSchedule.slots_overlapping(*busy, minutes.minutes), minutes
    end
  end

  test "an appointment starting on the half hour blocks the slots it overlaps and frees the next one" do
    busy = [ lisbon("2026-12-07", "10:30"), lisbon("2026-12-07", "11:15") ]

    assert_equal %w[10:30 11:00].map { |time| lisbon("2026-12-07", time) }, BookingSchedule.slots_overlapping(*busy, 30.minutes)
    assert_equal %w[10:00 10:30 11:00].map { |time| lisbon("2026-12-07", time) }, BookingSchedule.slots_overlapping(*busy, 60.minutes)
  end

  test "overlapped slots skip the lunch hour and follow summer time" do
    # Busy from 12:30 to 14:30 on a Monday in July, when Lisbon is UTC+1.
    busy = [ lisbon("2027-07-05", "12:30"), lisbon("2027-07-05", "14:30") ]

    assert_equal [ Time.utc(2027, 7, 5, 11), Time.utc(2027, 7, 5, 11, 30), Time.utc(2027, 7, 5, 13) ],
      BookingSchedule.slots_overlapping(*busy, 60.minutes)
  end

  private

  def lisbon(date, time)
    BookingSchedule.starts_at(date, time)
  end

  def slot?(date, time)
    BookingSchedule.slot?(BookingSchedule.starts_at(date.iso8601, time))
  end
end
