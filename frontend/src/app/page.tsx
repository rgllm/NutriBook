import { Suspense } from "react"

import { ResultsSkeleton } from "@/components/search/results-skeleton"
import { SearchForm } from "@/components/search/search-form"
import { SearchResults } from "@/components/search/search-results"
import { SiteHeader } from "@/components/site-header"
import { ApiUnavailableError } from "@/lib/api/http"
import { fetchLocations } from "@/lib/api/locations"
import { parseSearchParams } from "@/lib/search-params"

export default async function Home({ searchParams }: PageProps<"/">) {
  const { query, location, near } = parseSearchParams(await searchParams)
  
  const locations = await fetchLocations().catch((error: unknown) => {
    if (error instanceof ApiUnavailableError) return undefined
    throw error
  })

  return (
    <>
      <SiteHeader>
        <SearchForm query={query} location={location} near={near} locations={locations} />
      </SiteHeader>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  )
}
