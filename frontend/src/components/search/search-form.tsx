import Form from "next/form"
import { MapPinIcon } from "lucide-react"

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
          Nutritionist or service
        </FieldLabel>
        <InputGroup className={FIELD_ON_BAND}>
          <InputGroupInput
            id="search-query"
            name="q"
            defaultValue={query}
            placeholder="Search for a nutritionist or service"
          />
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor="search-location" className="sr-only">
          Location
        </FieldLabel>
        <InputGroup className={FIELD_ON_BAND}>
          <InputGroupInput
            id="search-location"
            name="location"
            list={locations && "known-cities"}
            autoComplete="address-level2"
            defaultValue={location}
            placeholder="Location"
            aria-describedby={locations && "search-location-hint"}
          />
          <InputGroupAddon align="inline-end">
            <MapPinIcon />
          </InputGroupAddon>
        </InputGroup>
        {locations && (
          <FieldDescription id="search-location-hint" className="px-3 text-xs text-brand-soft">
            If no location is provided we default to {locations.default}.
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
        Search
      </Button>
    </Form>
  )
}
