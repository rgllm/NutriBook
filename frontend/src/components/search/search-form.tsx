import type { ReactNode } from "react"
import Form from "next/form"
import { useTranslations } from "next-intl"

import { UseMyLocationButton } from "@/components/search/use-my-location-button"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

const FIELD_ON_BAND = "h-12 border-transparent bg-card text-foreground"

export function SearchForm({
  query = "",
  location = "",
  suggestions,
  disabled = false,
}: {
  query?: string
  location?: string
  // The city hint and datalist, which stream in after the fields.
  suggestions?: ReactNode
  disabled?: boolean
}) {
  const t = useTranslations("search")

  return (
    <Form
      // The form survives client navigations, and inputs ignore a new
      // defaultValue once mounted. A new key per search remounts them, so the
      // logo, back, and "Clear search" show the URL's values.
      key={`${query}|${location}`}
      action="/"
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
            // Both ids resolve once the suggestions arrive; until then the
            // browser ignores them.
            list="known-cities"
            autoComplete="address-level2"
            defaultValue={location}
            placeholder={t("locationPlaceholder")}
            aria-describedby="search-location-hint"
          />
          <InputGroupAddon align="inline-end">
            <UseMyLocationButton inputId="search-location" />
          </InputGroupAddon>
        </InputGroup>
        {suggestions}
      </Field>
      <Button type="submit" variant="brand-soft" size="lg" className="sm:px-10">
        {t("submit")}
      </Button>
      </fieldset>
    </Form>
  )
}
