import { describe, expect, it } from "vitest"

import { formatAppointmentStart, formatEuros, formatRequestTimeRange } from "@/lib/format"

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

describe("formatRequestTimeRange", () => {
  it("shows the start and end in Portuguese time", () => {
    expect(
      formatRequestTimeRange(new Date("2026-07-01T09:00:00Z"), new Date("2026-07-01T10:30:00Z")),
    ).toBe("10:00–11:30")
  })
})
