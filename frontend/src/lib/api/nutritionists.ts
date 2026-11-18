import { z } from "zod"

import { apiGet } from "@/lib/api/http"
import { toPracticeSlot } from "@/lib/appointment-request"
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
    taken_slots: z.array(z.iso.datetime()),
  })
  .transform(({ price, street_address, duration_minutes, distance_km, taken_slots, ...service }) => ({
    ...service,
    priceEur: price,
    streetAddress: street_address,
    durationMinutes: duration_minutes,
    distanceKm: distance_km,
    // The slots booking this service would refuse, as Lisbon days and times.
    takenSlots: taken_slots.map(toPracticeSlot),
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

const searchResponseSchema = z
  .object({
    nutritionists: z.array(nutritionistSchema),
    location: z.object({
      city: z.string(),
      source: z.enum(["input", "default", "fallback"]),
    }),
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

export function searchNutritionists(search: SearchState) {
  return apiGet("/nutritionists", searchResponseSchema, searchQuery(search))
}

