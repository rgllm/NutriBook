import { NutritionistCard } from "@/components/nutritionists/nutritionist-card"
import { LocationFallbackAlert } from "@/components/search/location-fallback-alert"
import { NoResults } from "@/components/search/no-results"
import { ResultsHeading } from "@/components/search/results-heading"
import { ResultsPagination } from "@/components/search/results-pagination"
import { resolveLocation } from "@/lib/location"
import { paginate } from "@/lib/pagination"
import { searchNutritionists } from "@/lib/search"
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
  const location = resolveLocation(search.location)
  const results = searchNutritionists(search.query, location.city)
  const { items, page, pageCount } = paginate(results, search.page)

  return (
    <>
      {location.source === "fallback" && (
        <LocationFallbackAlert input={search.location} city={location.city} />
      )}

      <ResultsHeading count={results.length} city={location.city} query={search.query} />

      {items.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {items.map((nutritionist) => (
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

      {pageCount > 1 && (
        <ResultsPagination
          page={page}
          pageCount={pageCount}
          hrefFor={(target) => searchHref({ ...search, page: target })}
        />
      )}
    </>
  )
}
