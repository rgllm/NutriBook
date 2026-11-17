import { cacheLife } from "next/cache"
import { z } from "zod"

import { apiGet } from "@/lib/api/http"

const locationsSchema = z.object({
  locations: z.array(z.string()),
  default: z.string(),
})

const nearestLocationSchema = z.object({ city: z.string() })

export type Locations = z.infer<typeof locationsSchema>

export function fetchLocations() {
  return apiGet("/locations", locationsSchema)
}

export async function cachedLocations() {
  "use cache"
  cacheLife("hours")
  return fetchLocations()
}

export async function fetchNearestCity(latitude: number, longitude: number) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) })
  const { city } = await apiGet("/locations/nearest", nearestLocationSchema, params)
  return city
}
