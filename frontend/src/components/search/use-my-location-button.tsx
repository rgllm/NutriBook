"use client"

import { useSyncExternalStore, useTransition, type MouseEvent } from "react"
import { LoaderCircleIcon, LocateFixedIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useNearbySearch } from "@/components/search/nearby-search"
import { InputGroupButton } from "@/components/ui/input-group"

// A position up to ten minutes old is still where the guest is.
const POSITION_OPTIONS: PositionOptions = { maximumAge: 600_000, timeout: 10_000 }

function currentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, POSITION_OPTIONS)
  })
}

// Support never changes while the page is open, so there is nothing to
// subscribe to. The server snapshot keeps the button disabled until hydration,
// when a click would otherwise do nothing.
const subscribe = () => () => {}
const supportsGeolocation = () => "geolocation" in navigator
const beforeHydration = () => false

// Three decimals is about a hundred metres: enough to order practices in a
// city, and all the server needs to know about where the guest is.
const coarse = (degrees: number) => Math.round(degrees * 1000) / 1000

export function UseMyLocationButton() {
  const t = useTranslations("search")
  const { searchNear } = useNearbySearch()
  const canLocate = useSyncExternalStore(subscribe, supportsGeolocation, beforeHydration)
  const [locating, startLocating] = useTransition()

  // Searches every city for the typed query, nearest first. The location
  // field empties because a typed city would limit the search to it.
  function searchNearMe(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    startLocating(async () => {
      let position: GeolocationPosition
      try {
        position = await currentPosition()
      } catch (error) {
        const denied = error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED
        toast.error(t(denied ? "locationDenied" : "locationUnavailable"))
        return
      }

      const location = form?.elements.namedItem("location")
      if (location instanceof HTMLInputElement) location.value = ""
      const query = String((form && new FormData(form).get("q")) ?? "").trim()
      searchNear(
        { latitude: coarse(position.coords.latitude), longitude: coarse(position.coords.longitude) },
        { query, location: "", page: 1 },
      )
    })
  }

  const label = t(locating ? "locating" : "useMyLocation")

  return (
    <InputGroupButton
      size="icon-sm"
      onClick={searchNearMe}
      disabled={!canLocate || locating}
      aria-label={label}
      title={label}
    >
      {locating ? <LoaderCircleIcon className="animate-spin" /> : <LocateFixedIcon />}
    </InputGroupButton>
  )
}
