import Form from "next/form"
import { MapPinIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
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
      action="/"
      role="search"
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
    >
      <Field>
        <FieldLabel htmlFor="search-query" className="sr-only">
          Name or service
        </FieldLabel>
        <InputGroup className={FIELD_ON_BAND}>
          <InputGroupInput
            id="search-query"
            name="q"
            defaultValue={query}
            placeholder="Name or service"
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
            placeholder={locations ? `Location (${locations.default} by default)` : "Location"}
          />
          <InputGroupAddon align="inline-end">
            <MapPinIcon />
          </InputGroupAddon>
        </InputGroup>
        {locations && (
          <datalist id="known-cities">
            {locations.locations.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        )}
      </Field>
      <Button type="submit" variant="brand" size="lg" className="sm:px-10">
        Search
      </Button>
    </Form>
  )
}
