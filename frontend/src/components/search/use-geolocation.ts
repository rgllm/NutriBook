"use client"

import { useSyncExternalStore, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { Position } from "@/lib/search-params"

// A position up to ten minutes old is still where the guest is.
const POSITION_OPTIONS: PositionOptions = { maximumAge: 600_000, timeout: 10_000 }

function currentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, POSITION_OPTIONS)
  })
}

// Support never changes while the page is open, so there is nothing to
// subscribe to. The server snapshot keeps controls disabled until hydration,
// when a click would otherwise do nothing.
const subscribe = () => () => {}
const supportsGeolocation = () => "geolocation" in navigator
const beforeHydration = () => false

// Three decimals is about a hundred metres: enough to order practices in a
// city, and all the server needs to know about where the guest is.
const coarse = (degrees: number) => Math.round(degrees * 1000) / 1000

// Asks the browser for the guest's position, explains a refusal or failure,
// and hands a coarse position to the caller, all inside one transition.
export function useGeolocation() {
  const t = useTranslations("search")
  const canLocate = useSyncExternalStore(subscribe, supportsGeolocation, beforeHydration)
  const [locating, startLocating] = useTransition()

  function locate(then: (position: Position) => Promise<void> | void) {
    startLocating(async () => {
      let position: GeolocationPosition
      try {
        position = await currentPosition()
      } catch (error) {
        const denied = error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED
        toast.error(t(denied ? "locationDenied" : "locationUnavailable"))
        return
      }
      await then({ latitude: coarse(position.coords.latitude), longitude: coarse(position.coords.longitude) })
    })
  }

  return { canLocate, locating, locate }
}
