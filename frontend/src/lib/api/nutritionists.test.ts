import { describe, expect, it, vi } from "vitest"

import { searchNutritionists } from "@/lib/api/nutritionists"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))

const search = { query: "follow", location: "porto", page: 2, near: null }

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
          distance_km: null,
        },
        {
          id: 34,
          name: "Follow-up",
          price: "19.5",
          street_address: "Avenida Ladislau Moraes, 232",
          city: "Porto",
          duration_minutes: 30,
          distance_km: null,
        },
        {
          id: 35,
          name: "Sports nutrition",
          price: "45.0",
          street_address: "Rua de Cedofeita, 9",
          city: "Porto",
          duration_minutes: 45,
          distance_km: null,
        },
      ],
      nearest_service_id: null,
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
          nearestServiceId: null,
          city: "Porto",
          addresses: [
            { streetAddress: "Avenida Ladislau Moraes, 232", city: "Porto", distanceKm: null },
            { streetAddress: "Rua de Cedofeita, 9", city: "Porto", distanceKm: null },
          ],
          services: [
            {
              id: 31,
              name: "First appointment",
              priceEur: 40,
              streetAddress: "Avenida Ladislau Moraes, 232",
              city: "Porto",
              durationMinutes: 60,
              distanceKm: null,
            },
            {
              id: 34,
              name: "Follow-up",
              priceEur: 19.5,
              streetAddress: "Avenida Ladislau Moraes, 232",
              city: "Porto",
              durationMinutes: 30,
              distanceKm: null,
            },
            {
              id: 35,
              name: "Sports nutrition",
              priceEur: 45,
              streetAddress: "Rua de Cedofeita, 9",
              city: "Porto",
              durationMinutes: 45,
              distanceKm: null,
            },
          ],
        },
      ],
      location: { city: "Porto", source: "input" },
      pagination: { page: 2, totalCount: 6, totalPages: 2 },
    })
  })
})

describe("searchNutritionists from a position", () => {
  const near = { latitude: 41.151, longitude: -8.61 }
  const [nutritionist] = payload.nutritionists
  const [, followUp, sports] = nutritionist.services
  const nearPayload = {
    ...payload,
    nutritionists: [
      {
        ...nutritionist,
        // Nearest first, but the sports search ranked them by Cedofeita.
        services: [
          { ...followUp, distance_km: 1.2 },
          { ...sports, distance_km: 4.5 },
        ],
        nearest_service_id: sports.id,
      },
    ],
  }

  it("sends the position with the search", async () => {
    const fetch = stubApi(Response.json(nearPayload))

    await searchNutritionists({ query: "sports", location: "Porto", page: 1, near })

    expect(String(fetch.mock.calls[0][0])).toBe(
      "http://api.test/nutritionists?q=sports&location=Porto&latitude=41.151&longitude=-8.61",
    )
  })

  it("lists the practice that ranked the nutritionist first, with its distance", async () => {
    stubApi(Response.json(nearPayload))

    const { nutritionists } = await searchNutritionists({ query: "sports", location: "Porto", page: 1, near })

    expect(nutritionists[0].nearestServiceId).toBe(sports.id)
    expect(nutritionists[0].addresses).toEqual([
      { streetAddress: "Rua de Cedofeita, 9", city: "Porto", distanceKm: 4.5 },
      { streetAddress: "Avenida Ladislau Moraes, 232", city: "Porto", distanceKm: 1.2 },
    ])
  })
})
