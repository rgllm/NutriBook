import { describe, expect, it } from "vitest"

import { contractViolations } from "@/test/openapi-contract"

const answer = (body: unknown) => ({
  method: "PATCH",
  url: new URL("http://api.test/nutritionists/1/appointment_requests/7"),
  body,
})

describe("contractViolations", () => {
  it("accepts a call and reply the spec describes", () => {
    expect(
      contractViolations(answer({ appointment_request: { status: "accepted" } }), {
        status: 200,
        body: { id: 7, status: "accepted", answered_at: "2026-11-20T12:00:00.000Z", rejected_ids: [] },
      }),
    ).toEqual([])
  })

  it("reports an endpoint the spec does not have", () => {
    expect(contractViolations({ method: "DELETE", url: new URL("http://api.test/nutritionists/1") })).toEqual([
      "DELETE /nutritionists/1 is not in openapi.yaml",
    ])
  })

  it("reports a path parameter the spec does not accept", () => {
    expect(
      contractViolations({ method: "GET", url: new URL("http://api.test/nutritionists/01/appointment_requests") }),
    ).toEqual([expect.stringContaining("listPendingAppointmentRequests path id must match pattern")])
  })

  it.each([
    ["", ["latitude", "longitude"]],
    ["?latitude=41.55", ["longitude"]],
    ["?longitude=-8.43", ["latitude"]],
  ])("reports missing required coordinates for %s", (query, missing) => {
    expect(
      contractViolations({ method: "GET", url: new URL(`http://api.test/locations/nearest${query}`) }),
    ).toEqual(missing.map((name) => `nearestLocation query ${name} is required`))
  })

  it.each([
    "/locations/nearest?latitude=41.55&longitude=-8.43",
    "/locations/nearest?latitude=&longitude=invalid",
    "/locations/nearest?latitude=bad&latitude=41.55&longitude=-8.43",
    "/nutritionists?q=Jo%C3%A3o+Silva&location=Braga&page=01",
    "/nutritionists?q=123&location=&page=invalid",
    "/nutritionists?unknown=ignored",
    "/nutritionists",
  ])("accepts decoded query strings as documented for %s", (path) => {
    expect(contractViolations({ method: "GET", url: new URL(`http://api.test${path}`) })).toEqual([])
  })

  it("reports a request body the spec does not describe", () => {
    expect(contractViolations(answer({ appointment_request: { answer: "accepted" } }))).toEqual([
      expect.stringContaining("answerAppointmentRequest request body/appointment_request must have required property 'status'"),
    ])
  })

  it("reports a reply that does not match the documented schema", () => {
    expect(
      contractViolations(answer({ appointment_request: { status: "accepted" } }), {
        status: 200,
        body: { id: 7, status: "accepted", answered_at: "yesterday", rejected_ids: [] },
      }),
    ).toEqual([expect.stringContaining("answered_at must match format \"date-time\"")])
  })

  it("reports a JSON reply for a status the spec does not document", () => {
    expect(
      contractViolations(answer({ appointment_request: { status: "accepted" } }), { status: 500, body: {} }),
    ).toEqual(["answerAppointmentRequest documents no JSON response for 500"])
  })
})
