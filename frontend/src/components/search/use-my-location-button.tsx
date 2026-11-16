"use client"

import { useSyncExternalStore, useTransition } from "react"
import { LoaderCircleIcon, LocateFixedIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { findNearestCity } from "@/app/actions"
import { InputGroupButton } from "@/components/ui/input-group"

// A position up to ten minutes old is still the same city.
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

// Two decimals is about a kilometre: enough to pick a city, and all the
// server needs to know about where the guest is.
const coarse = (degrees: number) => Math.round(degrees * 100) / 100

export function UseMyLocationButton({ inputId }: { inputId: string }) {
  const t = useTranslations("Search")
  const canLocate = useSyncExternalStore(subscribe, supportsGeolocation, beforeHydration)
  const [locating, startLocating] = useTransition()

  function fillNearestCity() {
    startLocating(async () => {
      let position: GeolocationPosition
      try {
        position = await currentPosition()
      } catch (error) {
        const denied = error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED
        toast.error(t(denied ? "locationDenied" : "locationUnavailable"))
        return
      }

      const result = await findNearestCity(coarse(position.coords.latitude), coarse(position.coords.longitude))
      if (result.status === "unavailable") {
        toast.error(t("nearestCityUnavailable"))
        return
      }

      // The input is uncontrolled, so the guest can still edit the city before
      // searching. Focus moves there so the new value is seen and announced.
      const input = document.getElementById(inputId)
      if (input instanceof HTMLInputElement) {
        input.value = result.city
        input.focus()
      }
    })
  }

  const label = t(locating ? "locating" : "useMyLocation")

  return (
    <InputGroupButton
      size="icon-sm"
      onClick={fillNearestCity}
      disabled={!canLocate || locating}
      aria-label={label}
      title={label}
    >
      {locating ? <LoaderCircleIcon className="animate-spin" /> : <LocateFixedIcon />}
    </InputGroupButton>
  )
}
