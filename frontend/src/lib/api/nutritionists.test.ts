import { afterEach, describe, expect, it, vi } from "vitest"

import { ApiUnavailableError } from "@/lib/api/http"
import { searchNutritionists } from "@/lib/api/nutritionists"

vi.mock("server-only", () => ({}))

const search = { query: "follow", location: "porto", page: 2 }

const payload = {
  nutritionists: [
    {
      id: 9,
      name: "Eduarda Macedo",
      title: "Dietitian",
      license_number: "3496N",
      offers_online: false,
      services: [
        {
          id: 31,
          name: "First appointment",
          price: "40.0",
          street_address: "Avenida Ladislau Moraes, 232",
          city: "Porto",
          duration_minutes: 60,
        },
        {
          id: 34,
          name: "Follow-up",
          price: "19.5",
          street_address: "Avenida Ladislau Moraes, 232",
          city: "Porto",
          duration_minutes: 30,
        },
        {
          id: 35,
          name: "Sports nutrition",
          price: "45.0",
          street_address: "Rua de Cedofeita, 9",
          city: "Porto",
          duration_minutes: 45,
        },
      ],
    },
  ],
  location: { city: "Porto", source: "input" },
  pagination: { page: 2, per_page: 5, total_count: 6, total_pages: 2 },
}

function respondWith(response: Response | Error) {
  const fetch = vi.fn<(url: URL) => Promise<Response>>(async () => {
    if (response instanceof Error) throw response
    return response
  })
  vi.stubGlobal("fetch", fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("searchNutritionists", () => {
  it("sends the search to the API and maps the response", async () => {
    const fetch = respondWith(Response.json(payload))

    const result = await searchNutritionists(search)

    expect(String(fetch.mock.calls[0][0])).toBe(
      "http://api.test/nutritionists?q=follow&location=porto&page=2",
    )
    expect(result).toEqual({
      nutritionists: [
        {
          id: 9,
          name: "Eduarda Macedo",
          title: "Dietitian",
          licenseNumber: "3496N",
          offersOnline: false,
          city: "Porto",
          addresses: ["Avenida Ladislau Moraes, 232", "Rua de Cedofeita, 9"],
          services: [
            {
              id: 31,
              name: "First appointment",
              priceEur: 40,
              streetAddress: "Avenida Ladislau Moraes, 232",
              durationMinutes: 60,
            },
            {
              id: 34,
              name: "Follow-up",
              priceEur: 19.5,
              streetAddress: "Avenida Ladislau Moraes, 232",
              durationMinutes: 30,
            },
            {
              id: 35,
              name: "Sports nutrition",
              priceEur: 45,
              streetAddress: "Rua de Cedofeita, 9",
              durationMinutes: 45,
            },
          ],
        },
      ],
      location: { city: "Porto", source: "input" },
      pagination: { page: 2, totalCount: 6, totalPages: 2 },
    })
  })

  it("reports the API as unavailable when it cannot be reached", async () => {
    respondWith(new TypeError("fetch failed"))

    await expect(searchNutritionists(search)).rejects.toBeInstanceOf(ApiUnavailableError)
  })

  it("reports the API as unavailable when it fails", async () => {
    respondWith(new Response(null, { status: 503 }))

    await expect(searchNutritionists(search)).rejects.toBeInstanceOf(ApiUnavailableError)
  })

  it("reports the API as unavailable when the body fails after the headers", async () => {
    const stalledBody = new ReadableStream({
      start(controller) {
        controller.error(new DOMException("The operation timed out.", "TimeoutError"))
      },
    })
    respondWith(new Response(stalledBody))

    await expect(searchNutritionists(search)).rejects.toBeInstanceOf(ApiUnavailableError)
  })

  it("treats malformed JSON as a bug, not an outage", async () => {
    respondWith(new Response("{", { headers: { "Content-Type": "application/json" } }))

    const error = await searchNutritionists(search).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(SyntaxError)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })

  it("treats a client error as a bug, not an outage", async () => {
    respondWith(new Response(null, { status: 404 }))

    const error = await searchNutritionists(search).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })

  it("rejects a service without a duration", async () => {
    const [nutritionist] = payload.nutritionists
    const [service, ...rest] = nutritionist.services
    respondWith(
      Response.json({
        ...payload,
        nutritionists: [
          { ...nutritionist, services: [{ ...service, duration_minutes: undefined }, ...rest] },
        ],
      }),
    )

    const error = await searchNutritionists(search).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })

  it("rejects a response that does not match the contract", async () => {
    respondWith(Response.json({ ...payload, pagination: undefined }))

    const error = await searchNutritionists(search).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiUnavailableError)
  })
})
