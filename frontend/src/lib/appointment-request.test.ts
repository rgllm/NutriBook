import { describe, expect, it } from "vitest"

import {
  isSlotInPast,
  practiceToday,
  toAppointmentErrors,
  toBookingDay,
} from "@/lib/appointment-request"

describe("toAppointmentErrors", () => {
  it("puts each API message under the form field it belongs to", () => {
    expect(
      toAppointmentErrors({
        guest_name: ["Enter your name."],
        guest_email: ["Enter a valid email, like name@example.com."],
        service: ["Choose a service."],
        starts_at: ["Pick one of the available times."],
        online: ["This nutritionist does not offer online appointments."],
      }),
    ).toEqual({
      name: "Enter your name.",
      email: "Enter a valid email, like name@example.com.",
      service: "Choose a service.",
      when: "Pick one of the available times.",
      online: "This nutritionist does not offer online appointments.",
    })
  })

  it("shows the first message of a field", () => {
    expect(toAppointmentErrors({ guest_email: ["First.", "Second."] })).toEqual({ email: "First." })
  })

  it("keeps a message for a field the form does not have", () => {
    expect(toAppointmentErrors({ nutritionist: ["must exist"] })).toEqual({ form: "must exist" })
  })

  it("has nothing to show when there are no errors", () => {
    expect(toAppointmentErrors({})).toEqual({})
  })
})

// The suite runs in Los Angeles (see vitest.config.mts), so calendar days built
// with new Date(y, m, d) are local midnights there, as the picker makes them.
describe("booking in Lisbon time from another zone", () => {
  // Monday 16 November, 16:00 in Los Angeles, is already Tuesday 00:00 in Lisbon.
  const lisbonMidnight = new Date("2026-11-17T00:00:00Z")

  it("starts the calendar at Lisbon's today", () => {
    expect(toBookingDay(practiceToday(lisbonMidnight))).toBe("2026-11-17")
  })

  it("treats every slot on a day Lisbon has left behind as past", () => {
    expect(isSlotInPast(new Date(2026, 10, 16), "18:00", lisbonMidnight)).toBe(true)
  })

  it("keeps Lisbon's remaining slots open when the browser is a day ahead", () => {
    // 16:30 in Lisbon on Monday 16 November is Tuesday 01:30 in Tokyo.
    const lisbonAfternoon = new Date("2026-11-16T16:30:00Z")
    const monday = new Date(2026, 10, 16)

    expect(toBookingDay(practiceToday(lisbonAfternoon))).toBe("2026-11-16")
    expect(isSlotInPast(monday, "16:00", lisbonAfternoon)).toBe(true)
    expect(isSlotInPast(monday, "17:00", lisbonAfternoon)).toBe(false)
  })

  it("follows Lisbon summer time", () => {
    // Clocks went forward on 28 March 2027; 09:30 UTC on the 29th is 10:30 in Lisbon.
    const now = new Date("2027-03-29T09:30:00Z")
    const monday = new Date(2027, 2, 29)

    expect(isSlotInPast(monday, "10:00", now)).toBe(true)
    expect(isSlotInPast(monday, "11:00", now)).toBe(false)
  })

  it("never treats a future day as past", () => {
    expect(isSlotInPast(new Date(2026, 10, 18), "09:00", lisbonMidnight)).toBe(false)
  })
})
