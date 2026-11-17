import { afterEach, describe, expect, it, vi } from "vitest"

import {
  answerAppointmentRequest,
  createAppointmentRequest,
  getPendingRequests,
} from "@/lib/api/appointment-requests"
import { ApiConflictError, ApiNotFoundError, ApiUnavailableError } from "@/lib/api/http"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))

const input = {
  serviceId: 381,
  guestName: "Joana Silva",
  guestEmail: "Joana.Silva@example.com",
  date: "2026-12-07",
  time: "10:00",
  online: true,
  language: "pt-PT",
}

afterEach(() => {
  vi.useRealTimers()
})

describe("createAppointmentRequest", () => {
  it("posts the request as the API expects and maps the created request", async () => {
    const fetch = stubApi(
      Response.json(
        {
          id: 17,
          status: "pending",
          guest_name: "Joana Silva",
          guest_email: "joana.silva@example.com",
          starts_at: "2026-12-07T10:00:00.000Z",
          ends_at: "2026-12-07T11:00:00.000Z",
          online: true,
          service: { id: 381, name: "Diabetes management", street_address: "Rua do Souto 45", city: "Braga" },
        },
        { status: 201 },
      ),
    )

    const result = await createAppointmentRequest(input)

    const [url, init] = fetch.mock.calls[0]
    expect(String(url)).toBe("http://api.test/appointment_requests")
    expect(init.method).toBe("POST")
    expect(JSON.parse(String(init.body))).toEqual({
      appointment_request: {
        service_id: 381,
        guest_name: "Joana Silva",
        guest_email: "Joana.Silva@example.com",
        date: "2026-12-07",
        time: "10:00",
        online: true,
        language: "pt-PT",
      },
    })
    expect(result).toEqual({
      ok: true,
      data: {
        id: 17,
        guestEmail: "joana.silva@example.com",
        startsAt: new Date("2026-12-07T10:00:00Z"),
        endsAt: new Date("2026-12-07T11:00:00Z"),
        online: true,
        serviceName: "Diabetes management",
      },
    })
  })

  it("returns the API's messages when it refuses the request", async () => {
    stubApi(
      Response.json(
        { errors: { starts_at: ["not_a_slot"] } },
        { status: 422 },
      ),
    )

    expect(await createAppointmentRequest(input)).toEqual({
      ok: false,
      errors: { starts_at: ["not_a_slot"] },
    })
  })

  it("reports the API as unavailable when it cannot be reached or fails", async () => {
    stubApi(new TypeError("fetch failed"))
    await expect(createAppointmentRequest(input)).rejects.toBeInstanceOf(ApiUnavailableError)

    stubApi(new Response(null, { status: 503 }))
    await expect(createAppointmentRequest(input)).rejects.toBeInstanceOf(ApiUnavailableError)
  })

  it("treats any other client error as a bug, not an outage", async () => {
    stubApi(new Response(null, { status: 400 }))

    const error = await createAppointmentRequest(input).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })
})

describe("getPendingRequests", () => {
  const pendingRequest = (id: number, startsAt: string, endsAt: string) => ({
    id,
    guest_name: "Rita Gomes",
    guest_email: "rita.gomes@example.com",
    starts_at: startsAt,
    ends_at: endsAt,
    online: false,
    service: { id: 1, name: "First appointment" },
  })

  it("reads the nutritionist's requests and marks the ones whose time has passed", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-20T12:00:00Z"), toFake: ["Date"] })
    const fetch = stubApi(
      Response.json({
        nutritionist: { id: 1, name: "Mary Jane" },
        appointment_requests: [
          pendingRequest(6, "2026-11-18T09:00:00.000Z", "2026-11-18T10:00:00.000Z"),
          pendingRequest(7, "2026-12-01T10:00:00.000Z", "2026-12-01T11:00:00.000Z"),
        ],
      }),
    )

    const pending = await getPendingRequests("1")

    expect(String(fetch.mock.calls[0][0])).toBe("http://api.test/nutritionists/1/appointment_requests")
    expect(pending).toEqual({
      nutritionist: { id: 1, name: "Mary Jane" },
      requests: [
        {
          id: 6,
          guestName: "Rita Gomes",
          guestEmail: "rita.gomes@example.com",
          startsAt: new Date("2026-11-18T09:00:00Z"),
          endsAt: new Date("2026-11-18T10:00:00Z"),
          online: false,
          serviceName: "First appointment",
          overdue: true,
        },
        {
          id: 7,
          guestName: "Rita Gomes",
          guestEmail: "rita.gomes@example.com",
          startsAt: new Date("2026-12-01T10:00:00Z"),
          endsAt: new Date("2026-12-01T11:00:00Z"),
          online: false,
          serviceName: "First appointment",
          overdue: false,
        },
      ],
    })
  })

  it("returns null when no nutritionist has the id", async () => {
    stubApi(Response.json({ error: "Nutritionist not found" }, { status: 404 }))

    expect(await getPendingRequests("999")).toBeNull()
  })

  it("reports the API as unavailable when it cannot be reached or fails", async () => {
    stubApi(new TypeError("fetch failed"))
    await expect(getPendingRequests("1")).rejects.toBeInstanceOf(ApiUnavailableError)

    stubApi(new Response(null, { status: 500 }))
    await expect(getPendingRequests("1")).rejects.toBeInstanceOf(ApiUnavailableError)
  })
})

describe("answerAppointmentRequest", () => {
  it("sends the answer to the nutritionist's request and maps the rejected ids", async () => {
    const fetch = stubApi(
      Response.json({
        id: 7,
        status: "accepted",
        answered_at: "2026-11-20T12:00:00.000Z",
        rejected_ids: [9],
      }),
    )

    const result = await answerAppointmentRequest("1", 7, "accepted")

    const [url, init] = fetch.mock.calls[0]
    expect(String(url)).toBe("http://api.test/nutritionists/1/appointment_requests/7")
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(String(init.body))).toEqual({ appointment_request: { status: "accepted" } })
    expect(result).toEqual({ ok: true, data: { id: 7, status: "accepted", rejectedIds: [9] } })
  })

  it("returns the API's message for a status it does not accept", async () => {
    stubApi(
      Response.json({ errors: { status: ["not_an_answer"] } }, { status: 422 }),
    )

    expect(await answerAppointmentRequest("1", 7, "maybe")).toEqual({
      ok: false,
      errors: { status: ["not_an_answer"] },
    })
  })

  it("carries the API's reason code when the request was already answered", async () => {
    stubApi(
      Response.json(
        { error: "already_accepted", status: "accepted" },
        { status: 409 },
      ),
    )

    const error = await answerAppointmentRequest("1", 7, "rejected").catch((error: unknown) => error)
    expect(error).toBeInstanceOf(ApiConflictError)
    expect((error as Error).message).toBe("already_accepted")
  })

  it("reports a request that is not the nutritionist's as not found", async () => {
    stubApi(Response.json({ error: "AppointmentRequest not found" }, { status: 404 }))

    await expect(answerAppointmentRequest("2", 7, "accepted")).rejects.toBeInstanceOf(ApiNotFoundError)
  })
})
