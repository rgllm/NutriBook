import { NutritionistCard } from "@/components/nutritionists/nutritionist-card"
import { LocationFallbackAlert } from "@/components/search/location-fallback-alert"
import { NoResults } from "@/components/search/no-results"
import { ResultsHeading } from "@/components/search/results-heading"
import { ResultsPagination } from "@/components/search/results-pagination"
import { SearchUnavailable } from "@/components/search/search-unavailable"
import { ApiUnavailableError } from "@/lib/api/http"
import { fetchLocations } from "@/lib/api/locations"
import { searchNutritionists } from "@/lib/api/nutritionists"
import {
  parseSearchParams,
  searchHref,
  type SearchParams,
} from "@/lib/search-params"

export async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const search = parseSearchParams(await searchParams)

  const responses = await Promise.all([searchNutritionists(search), fetchLocations()]).catch(
    (error: unknown) => {
      if (error instanceof ApiUnavailableError) return undefined
      throw error
    },
  )
  if (!responses) return <SearchUnavailable retryHref={searchHref(search)} />

  const [{ nutritionists, location, pagination }, locations] = responses

  return (
    <>
      {location.source === "fallback" && (
        <LocationFallbackAlert
          input={search.location}
          city={location.city}
          knownCities={locations.locations}
        />
      )}

      <ResultsHeading count={pagination.totalCount} city={location.city} query={search.query} />

      {nutritionists.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {nutritionists.map((nutritionist) => (
            <li key={nutritionist.id}>
              <NutritionistCard nutritionist={nutritionist} />
            </li>
          ))}
        </ul>
      ) : (
        <NoResults
          city={location.city}
          query={search.query}
          clearHref={searchHref({ ...search, query: "", page: 1 })}
        />
      )}

      {pagination.totalPages > 1 && (
        <ResultsPagination
          page={pagination.page}
          pageCount={pagination.totalPages}
          hrefFor={(target) => searchHref({ ...search, page: target })}
        />
      )}
    </>
  )
}
