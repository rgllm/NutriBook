import { z } from "zod"

import { apiGet } from "@/lib/api/http"
import { searchQuery, type SearchState } from "@/lib/search-params"

const serviceSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    price: z.coerce.number(),
    street_address: z.string(),
    duration_minutes: z.number(),
  })
  .transform(({ price, street_address, duration_minutes, ...service }) => ({
    ...service,
    priceEur: price,
    streetAddress: street_address,
    durationMinutes: duration_minutes,
  }))

const nutritionistSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    title: z.enum(["Dietitian", "Nutritionist"]),
    license_number: z.string(),
    offers_online: z.boolean(),
    services: z.array(serviceSchema),
  })
  .transform(({ license_number, offers_online, ...nutritionist }) => ({
    ...nutritionist,
    licenseNumber: license_number,
    offersOnline: offers_online,
    // Services arrive grouped by street address, so this keeps the API's order.
    addresses: [...new Set(nutritionist.services.map((service) => service.streetAddress))],
  }))

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
    // Every listed service is in the searched city, so it is the
    // nutritionist's city for this result.
    nutritionists: nutritionists.map((nutritionist) => ({ ...nutritionist, city: location.city })),
    location,
    pagination: {
      page: pagination.page,
      totalCount: pagination.total_count,
      totalPages: pagination.total_pages,
    },
  }))

export type Nutritionist = z.infer<typeof searchResponseSchema>["nutritionists"][number]
export type Service = Nutritionist["services"][number]

export function searchNutritionists(search: SearchState) {
  return apiGet("/nutritionists", searchResponseSchema, searchQuery(search))
}
