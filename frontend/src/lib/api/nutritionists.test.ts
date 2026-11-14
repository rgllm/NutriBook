import { afterEach, describe, expect, it, vi } from "vitest"

import { ApiUnavailableError } from "@/lib/api/client"
import { searchNutritionists } from "@/lib/api/nutritionists"

vi.mock("server-only", () => ({}))

const search = { query: "follow", location: "porto", page: 2 }

const payload = {
  nutritionists: [
    {
      id: 9,
      slug: "eduarda-macedo",
      name: "Eduarda Macedo",
      title: "Dietitian",
      license_number: "3496N",
      address: "Avenida Ladislau Moraes, 232",
      offers_online: false,
      services: [
        { id: 34, name: "Follow-up", price: "19.5", location: "Porto", duration_minutes: 30 },
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
          slug: "eduarda-macedo",
          name: "Eduarda Macedo",
          title: "Dietitian",
          licenseNumber: "3496N",
          address: "Avenida Ladislau Moraes, 232",
          offersOnline: false,
          city: "Porto",
          services: [{ id: 34, name: "Follow-up", priceEur: 19.5, durationMinutes: 30 }],
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

  it("treats a client error as a bug, not an outage", async () => {
    respondWith(new Response(null, { status: 404 }))

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
