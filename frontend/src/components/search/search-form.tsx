import Form from "next/form"
import { useTranslations } from "next-intl"

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
}: {
  query?: string
  location?: string
  locations?: Locations
}) {
  const t = useTranslations("Search")

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
            <UseMyLocationButton inputId="search-location" />
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
    </Form>
  )
}
