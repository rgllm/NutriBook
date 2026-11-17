import { ResultsView } from "@/components/search/results-view"
import { SearchUnavailable } from "@/components/search/search-unavailable"
import { ApiUnavailableError } from "@/lib/api/http"
import { searchNutritionists } from "@/lib/api/nutritionists"
import { parseSearchParams, searchHref, type SearchParams } from "@/lib/search-params"

export async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const search = parseSearchParams(await searchParams)

  const results = await searchNutritionists(search).catch((error: unknown) => {
    if (error instanceof ApiUnavailableError) return undefined
    throw error
  })
  if (!results) return <SearchUnavailable retryHref={searchHref(search)} />

  return <ResultsView results={results} search={search} />
}
