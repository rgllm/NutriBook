"use client"

import type { FormEvent } from "react"
import Form from "next/form"
import { useTranslations } from "next-intl"

import { useNearbySearch } from "@/components/search/nearby-search"
import { UseMyLocationButton } from "@/components/search/use-my-location-button"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { Locations } from "@/lib/api/locations"

const FIELD_ON_BAND = "h-12 border-transparent bg-card text-foreground"

export function SearchForm({
  query = "",
  location = "",
  locations,
  disabled = false,
}: {
  query?: string
  location?: string
  locations?: Locations
  disabled?: boolean
}) {
  const t = useTranslations("search")
  const { nearby, searchNear } = useNearbySearch()

  // While searching from the guest's position, a new query or a typed city
  // searches from there too, without putting the position in the URL.
  function searchNearby(event: FormEvent<HTMLFormElement>) {
    if (!nearby) return

    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => String(data.get(key) ?? "").trim()
    searchNear(nearby.position, { query: text("q"), location: text("location"), page: 1 })
  }

  return (
    <Form
      // The form survives client navigations, and inputs ignore a new
      // defaultValue once mounted. A new key per search remounts them, so the
      // logo, back, and "Clear search" show the URL's values.
      key={`${query}|${location}`}
      action="/"
      onSubmit={searchNearby}
      role="search"
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
    >
      {/* `contents` keeps the fields in the form's grid. */}
      <fieldset disabled={disabled} className="contents">
      <Field>
        <FieldLabel htmlFor="search-query" className="sr-only">
          {t("queryLabel")}
        </FieldLabel>
        <InputGroup className={FIELD_ON_BAND}>
          <InputGroupInput
            id="search-query"
            name="q"
            defaultValue={query}
            placeholder={t("queryPlaceholder")}
          />
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor="search-location" className="sr-only">
          {t("locationLabel")}
        </FieldLabel>
        <InputGroup className={FIELD_ON_BAND}>
          <InputGroupInput
            id="search-location"
            name="location"
            list={locations && "known-cities"}
            autoComplete="address-level2"
            defaultValue={location}
            placeholder={t("locationPlaceholder")}
            aria-describedby={locations && "search-location-hint"}
          />
          <InputGroupAddon align="inline-end">
            <UseMyLocationButton />
          </InputGroupAddon>
        </InputGroup>
        {locations && (
          <FieldDescription id="search-location-hint" className="px-3 text-xs text-brand-soft">
            {t("locationHint", { city: locations.default })}
          </FieldDescription>
        )}
        {locations && (
          <datalist id="known-cities">
            {locations.locations.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        )}
      </Field>
      <Button type="submit" variant="brand-soft" size="lg" className="sm:px-10">
        {t("submit")}
      </Button>
      </fieldset>
    </Form>
  )
}
