"use client"

import { createContext, use, useRef, useState, useTransition, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"

import { searchNearby, type NearbySearchResult } from "@/app/actions"
import type { Position } from "@/lib/api/nutritionists"
import type { SearchState } from "@/lib/search-params"

// A search measured from the guest's position. The position lives only in
// this state, so a refresh, a shared link, or any navigation leaves it behind.
type Nearby = { position: Position; search: SearchState; result: NearbySearchResult }

type NearbySearch = {
  nearby: Nearby | null
  pending: boolean
  searchNear: (position: Position, search: SearchState) => void
  stop: () => void
}

// Outside the provider, the search form works as a plain city search.
const NearbySearchContext = createContext<NearbySearch>({
  nearby: null,
  pending: false,
  searchNear: () => {},
  stop: () => {},
})

export const useNearbySearch = () => use(NearbySearchContext)

export function NearbySearchProvider({ children }: { children: ReactNode }) {
  const [nearby, setNearby] = useState<Nearby | null>(null)
  const [pending, startTransition] = useTransition()
  // Only the latest search may show, however the answers arrive.
  const latest = useRef(0)

  // Navigating, with the logo or a link to a plain search, leaves nearby mode.
  const params = useSearchParams().toString()
  const [paramsShown, setParamsShown] = useState(params)
  if (params !== paramsShown) {
    setParamsShown(params)
    setNearby(null)
  }

  function searchNear(position: Position, search: SearchState) {
    const request = ++latest.current
    startTransition(async () => {
      const result = await searchNearby(search, position)
      if (request !== latest.current) return
      startTransition(() => setNearby({ position, search, result }))
    })
  }

  function stop() {
    latest.current++
    setNearby(null)
  }

  return (
    <NearbySearchContext value={{ nearby, pending, searchNear, stop }}>
      {children}
    </NearbySearchContext>
  )
}
