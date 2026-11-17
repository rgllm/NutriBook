"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { useNearbySearch } from "@/components/search/nearby-search"
import { ResultsSkeleton } from "@/components/search/results-skeleton"
import { ResultsView } from "@/components/search/results-view"
import { SearchUnavailable } from "@/components/search/search-unavailable"
import { Button } from "@/components/ui/button"
import { searchHref } from "@/lib/search-params"

// The results of a search from the guest's position, in place of the
// server-rendered city results passed as children.
export function NearbyResults({ children }: { children: ReactNode }) {
  const t = useTranslations("search")
  const nearbySearch = useNearbySearch()
  if (!nearbySearch) return children

  const { nearby, pending, searchNear, stop } = nearbySearch
  if (!nearby) return pending ? <ResultsSkeleton /> : children
  if (nearby.result.status === "unavailable") return <SearchUnavailable retryHref={searchHref(nearby.search)} />

  return (
    <div aria-busy={pending} className="flex flex-col gap-6 aria-busy:opacity-60">
      <ResultsView
        results={nearby.result.results}
        search={nearby.search}
        onPageSelect={(page) => searchNear(nearby.position, { ...nearby.search, page })}
        headingAction={
          <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
            {t("nearestFirst")}
            <Button variant="link" className="h-auto p-0" onClick={stop}>
              {t("stopNearby")}
            </Button>
          </p>
        }
      />
    </div>
  )
}
