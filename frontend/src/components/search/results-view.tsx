import type { ReactNode } from "react"

import { NutritionistCard } from "@/components/nutritionists/nutritionist-card"
import { LocationFallbackAlert } from "@/components/search/location-fallback-alert"
import { NoResults } from "@/components/search/no-results"
import { ResultsHeading } from "@/components/search/results-heading"
import { ResultsPagination } from "@/components/search/results-pagination"
import type { SearchResults } from "@/lib/api/nutritionists"
import { searchHref, type SearchState } from "@/lib/search-params"

// One page of results, from the city search or from the guest's position.
export function ResultsView({
  results,
  search,
  onPageSelect,
  headingAction,
}: {
  results: SearchResults
  search: SearchState
  onPageSelect?: (page: number) => void
  headingAction?: ReactNode
}) {
  const { nutritionists, location, pagination } = results

  return (
    <>
      {location.source === "fallback" && (
        <LocationFallbackAlert input={search.location} city={location.city} />
      )}

      <ResultsHeading count={pagination.totalCount} city={location.city} query={search.query}>
        {headingAction}
      </ResultsHeading>

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
          onSelect={onPageSelect}
        />
      )}
    </>
  )
}
