import { z } from "zod"

import { apiGet, apiWrite } from "@/lib/api/http"
import { searchQuery, type SearchState } from "@/lib/search-params"

const serviceSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    price: z.coerce.number(),
    street_address: z.string(),
    city: z.string(),
    duration_minutes: z.number(),
    distance_km: z.number().nullable(),
  })
  .transform(({ price, street_address, duration_minutes, distance_km, ...service }) => ({
    ...service,
    priceEur: price,
    streetAddress: street_address,
    durationMinutes: duration_minutes,
    distanceKm: distance_km,
  }))

type ApiService = z.infer<typeof serviceSchema>

// Each practice once, in the API's order (nearest first when it measured
// distances), except that the practice of the service booking starts from
// comes first, so the distance shown first is the one that ranked the card.
function practices(services: ApiService[], nearestServiceId: number | null) {
  const nearest = services.find((service) => service.id === nearestServiceId)
  const ordered = nearest ? [nearest, ...services.filter((service) => service !== nearest)] : services
  const byAddress = new Map<string, Pick<ApiService, "streetAddress" | "city" | "distanceKm">>()
  for (const { streetAddress, city, distanceKm } of ordered) {
    const key = `${city}|${streetAddress}`
    if (!byAddress.has(key)) byAddress.set(key, { streetAddress, city, distanceKm })
  }
  return [...byAddress.values()]
}

const nutritionistSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    title: z.enum(["Dietitian", "Nutritionist"]),
    license_number: z.string(),
    offers_online: z.boolean(),
    services: z.array(serviceSchema).min(1),
    nearest_service_id: z.number().nullable(),
  })
  .transform(({ license_number, offers_online, nearest_service_id, ...nutritionist }) => {
    const addresses = practices(nutritionist.services, nearest_service_id)
    return {
      ...nutritionist,
      licenseNumber: license_number,
      offersOnline: offers_online,
      nearestServiceId: nearest_service_id,
      addresses,
      city: addresses[0].city,
    }
  })

const locationSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("nearby"), city: z.null() }),
  z.object({ source: z.enum(["input", "default", "fallback"]), city: z.string() }),
])

const searchResponseSchema = z
  .object({
    nutritionists: z.array(nutritionistSchema),
    location: locationSchema,
    pagination: z.object({
      page: z.number(),
      total_count: z.number(),
      total_pages: z.number(),
    }),
  })
  .transform(({ nutritionists, location, pagination }) => ({
    nutritionists,
    location,
    pagination: {
      page: pagination.page,
      totalCount: pagination.total_count,
      totalPages: pagination.total_pages,
    },
  }))

export type SearchResults = z.infer<typeof searchResponseSchema>
export type Nutritionist = SearchResults["nutritionists"][number]
export type Service = Nutritionist["services"][number]

export type Position = { latitude: number; longitude: number }

export function searchNutritionists(search: SearchState) {
  return apiGet("/nutritionists", searchResponseSchema, searchQuery(search))
}

// The position travels in the body, never in a URL.
export async function searchNutritionistsNear(search: SearchState, position: Position) {
  const result = await apiWrite(
    "POST",
    "/nutritionists/nearby",
    { q: search.query, location: search.location, page: search.page, ...position },
    searchResponseSchema,
  )
  if (!result.ok) throw new Error(`POST /nutritionists/nearby refused the position: ${JSON.stringify(result.errors)}`)
  return result.data
}
