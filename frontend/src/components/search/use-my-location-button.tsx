"use client"

import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, LocateFixedIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { findNearestCity } from "@/app/actions"
import { useGeolocation } from "@/components/search/use-geolocation"
import { InputGroupButton } from "@/components/ui/input-group"
import { searchHref } from "@/lib/search-params"

// Searches the nearest city for the typed query, nearest practices first.
export function UseMyLocationButton() {
  const t = useTranslations("search")
  const router = useRouter()
  const { canLocate, locating, locate } = useGeolocation()

  function searchNearMe(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    locate(async (near) => {
      const result = await findNearestCity(near.latitude, near.longitude)
      if (result.status === "unavailable") {
        toast.error(t("nearestCityUnavailable"))
        return
      }
      const query = String((form && new FormData(form).get("q")) ?? "").trim()
      router.push(searchHref({ query, location: result.city, page: 1, near }))
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
