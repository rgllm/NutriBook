import { afterEach, describe, expect, it, vi } from "vitest"

import { createAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiUnavailableError } from "@/lib/api/http"

vi.mock("server-only", () => ({}))

const input = {
  serviceId: "381",
  guestName: "Joana Silva",
  guestEmail: "Joana.Silva@example.com",
  date: "2026-12-07",
  time: "10:00",
  online: true,
}

function respondWith(response: Response | Error) {
  const fetch = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(async () => {
    if (response instanceof Error) throw response
    return response
  })
  vi.stubGlobal("fetch", fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("createAppointmentRequest", () => {
  it("posts the request as the API expects and maps the created request", async () => {
    const fetch = respondWith(
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
        service_id: "381",
        guest_name: "Joana Silva",
        guest_email: "Joana.Silva@example.com",
        date: "2026-12-07",
        time: "10:00",
        online: true,
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
    respondWith(
      Response.json(
        { errors: { starts_at: ["Pick one of the available times."] } },
        { status: 422 },
      ),
    )

    expect(await createAppointmentRequest(input)).toEqual({
      ok: false,
      errors: { starts_at: ["Pick one of the available times."] },
    })
  })

  it("reports the API as unavailable when it cannot be reached or fails", async () => {
    respondWith(new TypeError("fetch failed"))
    await expect(createAppointmentRequest(input)).rejects.toBeInstanceOf(ApiUnavailableError)

    respondWith(new Response(null, { status: 503 }))
    await expect(createAppointmentRequest(input)).rejects.toBeInstanceOf(ApiUnavailableError)
  })

  it("treats any other client error as a bug, not an outage", async () => {
    respondWith(new Response(null, { status: 400 }))

    const error = await createAppointmentRequest(input).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })
})
