import { SearchForm } from "@/components/search/search-form"
import { parseSearchParams, type SearchParams } from "@/lib/search-params"

export async function PrefilledSearchForm({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { query, location } = parseSearchParams(await searchParams)
  return <SearchForm query={query} location={location} />
}
