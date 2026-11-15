import { describe, expect, it } from "vitest"

import { formatAppointmentStart, formatEuros } from "@/lib/format"

describe("formatEuros", () => {
  it("puts the symbol after the amount", () => {
    expect(formatEuros(39)).toBe("39€")
  })

  it("shows cents only when there are any", () => {
    expect(formatEuros(19.5)).toBe("19.50€")
  })
})

describe("formatAppointmentStart", () => {
  it("shows the start in Portuguese time, whatever zone renders it", () => {
    expect(formatAppointmentStart(new Date("2026-12-07T10:00:00Z"))).toBe("Monday 7 December at 10:00")
    expect(formatAppointmentStart(new Date("2027-07-05T09:00:00Z"))).toBe("Monday 5 July at 10:00")
  })
})
