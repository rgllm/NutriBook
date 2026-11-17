import { describe, expect, it, vi } from "vitest"

import { requestAppointment } from "@/app/actions"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))
vi.mock("next-intl/server", () => import("@/test/translations"))

const initialState = { status: "editing", errors: {}, values: { name: "", email: "" } } as const

function submit(fields: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) formData.set(key, value)
  return requestAppointment(initialState, formData)
}

const filledIn = {
  name: "Joana Silva",
  email: "Joana.Silva@example.com",
  service_id: "381",
  date: "2026-12-07",
  time: "10:00",
  online: "true",
  language: "pt-PT",
}

describe("requestAppointment", () => {
  it("sends the guest's picks and returns the created request", async () => {
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

    expect(await submit(filledIn)).toEqual({
      status: "sent",
      request: {
        id: 17,
        guestEmail: "joana.silva@example.com",
        startsAt: new Date("2026-12-07T10:00:00Z"),
        endsAt: new Date("2026-12-07T11:00:00Z"),
        online: true,
        serviceName: "Diabetes management",
      },
    })
    expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({
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
  })

  it("puts the API's messages on their fields and keeps what the guest typed", async () => {
    const fetch = stubApi(
      Response.json(
        {
          errors: {
            service: ["blank"],
            guest_email: ["invalid"],
            starts_at: ["not_a_slot"],
          },
        },
        { status: 422 },
      ),
    )

    expect(
      await submit({ ...filledIn, email: "joana@example", service_id: "", date: "", time: "", online: "false" }),
    ).toEqual({
      status: "editing",
      errors: {
        service: "Choose a service.",
        email: "Enter a valid email, like name@example.com.",
        when: "Pick one of the available times.",
      },
      values: { name: "Joana Silva", email: "joana@example" },
    })
    expect(JSON.parse(String(fetch.mock.calls[0][1].body)).appointment_request).not.toHaveProperty("service_id")
  })

  it("asks to try again and keeps what the guest typed when the API is unavailable", async () => {
    stubApi(new TypeError("fetch failed"))

    expect(await submit(filledIn)).toEqual({
      status: "editing",
      errors: { form: "We could not send your request. Try again in a moment." },
      values: { name: "Joana Silva", email: "Joana.Silva@example.com" },
    })
  })
})
