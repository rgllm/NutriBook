import { Suspense } from "react"

import { LocationSuggestions } from "@/components/search/location-suggestions"
import { SearchForm } from "@/components/search/search-form"
import { parseSearchParams, type SearchParams } from "@/lib/search-params"

// Reading searchParams has to happen inside the page's Suspense boundary, so
// this wrapper does it and hands the values to the plain form. Suggestions
// load on their own, so a slow API never holds up the fields.
export async function PrefilledSearchForm({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { query, location } = parseSearchParams(await searchParams)
  return (
    <SearchForm
      query={query}
      location={location}
      suggestions={
        <Suspense>
          <LocationSuggestions />
        </Suspense>
      }
    />
  )
}
