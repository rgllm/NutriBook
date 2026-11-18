"use client"

import type { FormEvent } from "react"
import Form from "next/form"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import type { Locations } from "@/lib/api/locations"
import type { Position } from "@/lib/search-params"

const FIELD_ON_BAND = "h-12 border-transparent bg-card text-foreground"

export function SearchForm({
  query = "",
  location = "",
  near = null,
  locations,
}: {
  query?: string
  location?: string
  near?: Position | null
  locations?: Locations
}) {
  const t = useTranslations("search")

  // A blank location searches the default city. Naming it here keeps the field
  // showing it, since the resulting search may not remount the form.
  function fillDefaultLocation(event: FormEvent<HTMLFormElement>) {
    const input = event.currentTarget.elements.namedItem("location")
    if (locations && input instanceof HTMLInputElement && !input.value.trim()) input.value = locations.default
  }

  return (
    <Form
      // The form survives client navigations, and inputs ignore a new
      // defaultValue once mounted. A new key per search remounts them, so the
      // logo, back, and "Clear search" show the URL's values.
      key={`${query}|${location}|${near?.latitude},${near?.longitude}`}
      action="/"
      onSubmit={fillDefaultLocation}
      role="search"
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
    >
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
            // A blank location searches the default city, so the field shows it.
            defaultValue={location || locations?.default}
            placeholder={t("locationPlaceholder")}
          />
        </InputGroup>
        {locations && (
          <datalist id="known-cities">
            {locations.locations.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        )}
      </Field>
      {/* A new search keeps the distance order. */}
      {near && (
        <>
          <input type="hidden" name="latitude" value={near.latitude} />
          <input type="hidden" name="longitude" value={near.longitude} />
        </>
      )}
      <Button type="submit" variant="brand-soft" size="lg" className="sm:px-10">
        {t("submit")}
      </Button>
    </Form>
  )
}
