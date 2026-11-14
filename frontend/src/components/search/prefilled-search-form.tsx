import { SearchForm } from "@/components/search/search-form"
import { ApiUnavailableError } from "@/lib/api/client"
import { fetchLocations } from "@/lib/api/locations"
import { parseSearchParams, type SearchParams } from "@/lib/search-params"

export async function PrefilledSearchForm({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { query, location } = parseSearchParams(await searchParams)
  // The form still works without suggestions; the results explain the outage.
  const locations = await fetchLocations().catch((error: unknown) => {
    if (error instanceof ApiUnavailableError) return undefined
    throw error
  })
  return <SearchForm query={query} location={location} locations={locations} />
}
