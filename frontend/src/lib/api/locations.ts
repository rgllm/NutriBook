import { z } from "zod"

import { apiGet } from "@/lib/api/client"

const locationsSchema = z.object({
  locations: z.array(z.string()),
  default: z.string(),
})

export type Locations = z.infer<typeof locationsSchema>

export function fetchLocations() {
  return apiGet("/locations", locationsSchema)
}
