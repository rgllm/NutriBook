import { cacheLife, cacheTag } from "next/cache"
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

// The cities change only when services are seeded, so one answer serves every
// search for a while. A failed request throws and is never cached.
export async function cachedLocations() {
  "use cache"
  cacheLife("hours")
  cacheTag("locations")
  return fetchLocations()
}

export async function fetchNearestCity(latitude: number, longitude: number) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) })
  const { city } = await apiGet("/locations/nearest", nearestLocationSchema, params)
  return city
}
