import { describe, expect, it } from "vitest"

import type { PendingRequest } from "@/lib/api/appointment-requests"
import { overlappingRequests } from "@/lib/pending-requests"

function request(id: number, start: string, end: string): PendingRequest {
  return {
    id,
    guestName: `Guest ${id}`,
    guestEmail: `guest${id}@example.com`,
    startsAt: new Date(`2026-12-07T${start}:00Z`),
    endsAt: new Date(`2026-12-07T${end}:00Z`),
    online: false,
    serviceName: "Consultation",
    overdue: false,
  }
}

describe("overlappingRequests", () => {
  it("finds direct conflicts, including containment and different durations, but excludes self and adjacent requests", () => {
    const chosen = request(1, "10:00", "11:00")
    const conflicts = [
      request(2, "09:00", "10:30"),
      request(3, "10:00", "10:30"),
      request(4, "09:00", "12:00"),
      request(5, "10:30", "11:30"),
    ]
    const others = [request(6, "09:00", "10:00"), request(7, "11:00", "12:00")]

    expect(overlappingRequests(chosen, [chosen, ...conflicts, ...others])).toEqual(conflicts)
  })

  it("does not include transitive overlaps", () => {
    const first = request(1, "09:00", "10:00")
    const middle = request(2, "09:30", "10:30")
    const last = request(3, "10:00", "11:00")
    const requests = [first, middle, last]

    expect(overlappingRequests(first, requests)).toEqual([middle])
    expect(overlappingRequests(middle, requests)).toEqual([first, last])
    expect(overlappingRequests(last, requests)).toEqual([middle])
  })

  it("leaves isolated requests unchanged and compares instants across offsets", () => {
    const chosen = request(1, "10:00", "11:00")
    const equivalent = { ...request(2, "10:00", "11:00"), startsAt: new Date("2026-12-07T11:00:00+01:00") }
    expect(overlappingRequests(chosen, [chosen])).toEqual([])
    expect(overlappingRequests(chosen, [chosen, equivalent])).toEqual([equivalent])
  })
})
