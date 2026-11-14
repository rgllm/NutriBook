"use client"

import { useEffect, useRef, useTransition, type FormEvent } from "react"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { MapPinIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { Locations } from "@/lib/api/locations"
import { searchHref } from "@/lib/search-params"

const FIELD_ON_BAND = "h-12 border-transparent bg-card text-foreground"
const SEARCH_DELAY_MS = 300

export function SearchForm({
  query = "",
  location = "",
  locations,
}: {
  query?: string
  location?: string
  locations?: Locations
}) {
  const router = useRouter()
  const [isSearching, startTransition] = useTransition()
  const pendingSearch = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(pendingSearch.current), [])

  // Typing searches after a pause. Enter and the button still submit at once,
  // and the form works as a plain GET without JavaScript.
  function searchAfterPause(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    clearTimeout(pendingSearch.current)
    pendingSearch.current = setTimeout(() => {
      const fields = new FormData(form)
      const href = searchHref({
        query: String(fields.get("q") ?? "").trim(),
        location: String(fields.get("location") ?? "").trim(),
        page: 1,
      })
      startTransition(() => router.replace(href, { scroll: false }))
    }, SEARCH_DELAY_MS)
  }

  return (
    <Form
      action="/"
      role="search"
      onInput={searchAfterPause}
      onSubmit={() => clearTimeout(pendingSearch.current)}
      aria-busy={isSearching}
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
