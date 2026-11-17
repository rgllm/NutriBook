"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { useGeolocation } from "@/components/search/use-geolocation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchHref, type SearchState } from "@/lib/search-params"

type Sort = "relevance" | "distance"

// Distance needs the guest's position, so choosing it asks the browser first.
export function SortSelect({ search }: { search: SearchState }) {
  const t = useTranslations("search")
  const router = useRouter()
  const { canLocate, locating, locate } = useGeolocation()
  const [navigating, startNavigating] = useTransition()
  const current: Sort = search.near ? "distance" : "relevance"
  const items = [
    { value: "relevance", label: t("sortRelevance") },
    { value: "distance", label: t("sortDistance") },
  ]

  function choose(sort: string | null) {
    if (sort === current) return
    if (sort === "relevance") {
      startNavigating(() => router.push(searchHref({ ...search, page: 1, near: null })))
    } else if (sort === "distance") {
      locate((near) => router.push(searchHref({ ...search, page: 1, near })))
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span aria-hidden>{t("sortLabel")}</span>
      <Select items={items} value={current} onValueChange={choose} disabled={locating || navigating}>
        <SelectTrigger size="sm" aria-label={t("sortLabel")} className="bg-card text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          {items.map(({ value, label }) => (
            <SelectItem key={value} value={value} disabled={value === "distance" && !canLocate && !search.near}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
