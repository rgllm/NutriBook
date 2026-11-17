import { KnownCities } from "@/components/search/known-cities"
import { ApiUnavailableError } from "@/lib/api/http"
import { cachedLocations } from "@/lib/api/locations"

// Streams in after the search fields, which work without it; the results
// explain an outage.
export async function LocationSuggestions() {
  const locations = await cachedLocations().catch((error: unknown) => {
    if (error instanceof ApiUnavailableError) return undefined
    throw error
  })
  return locations && <KnownCities locations={locations} />
}
