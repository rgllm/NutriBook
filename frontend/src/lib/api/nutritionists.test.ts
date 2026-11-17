import { describe, expect, it, vi } from "vitest"

import { searchNutritionists } from "@/lib/api/nutritionists"
import { stubApi } from "@/test/stub-api"

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

describe("searchNutritionists", () => {
  it("sends the search to the API and maps the response", async () => {
    const fetch = stubApi(Response.json(payload))

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
})
