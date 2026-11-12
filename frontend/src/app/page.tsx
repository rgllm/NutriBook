import { Suspense } from "react"

import { PrefilledSearchForm } from "@/components/search/prefilled-search-form"
import { ResultsSkeleton } from "@/components/search/results-skeleton"
import { SearchForm } from "@/components/search/search-form"
import { SearchResults } from "@/components/search/search-results"
import { SiteHeader } from "@/components/site-header"

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <SiteHeader>
        <Suspense fallback={<SearchForm />}>
          <PrefilledSearchForm searchParams={searchParams} />
        </Suspense>
      </SiteHeader>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  )
}
