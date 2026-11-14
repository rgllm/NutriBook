"use client"

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react"
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
  const [fields, setFields] = useState({ query, location })
  const [shownSearch, setShownSearch] = useState({ query, location })
  // Typed searches sent to the router that have not rendered yet, oldest first.
  const [loadingHrefs, setLoadingHrefs] = useState<string[]>([])

  function cancelPendingSearch() {
    clearTimeout(pendingSearch.current)
    pendingSearch.current = undefined
  }

  // A navigation the guest starts (a link such as the logo, back, forward)
  // supersedes a typed search still waiting for its pause. The fields go back
  // to the search on screen; the navigation then updates them if it changes it.
  const abandonPendingSearch = useEffectEvent(() => {
    if (pendingSearch.current === undefined) return
    cancelPendingSearch()
    setFields(shownSearch)
  })

  useEffect(() => {
    const abandonOnLinkClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) abandonPendingSearch()
    }
    document.addEventListener("click", abandonOnLinkClick, { capture: true })
    window.addEventListener("popstate", abandonPendingSearch)
    return () => {
      clearTimeout(pendingSearch.current)
      document.removeEventListener("click", abandonOnLinkClick, { capture: true })
      window.removeEventListener("popstate", abandonPendingSearch)
    }
  }, [])

  // The form outlives navigations. When a typed search renders, the fields stay
  // as they are, since the guest may have typed more since; it and any older
  // search it superseded leave the queue. Any other navigation resets the
  // fields to the URL.
  if (query !== shownSearch.query || location !== shownSearch.location) {
    setShownSearch({ query, location })
    const typed = loadingHrefs.indexOf(searchHref({ query, location, page: 1 }))
    if (typed === -1) {
      setFields({ query, location })
      setLoadingHrefs([])
    } else {
      setLoadingHrefs(loadingHrefs.slice(typed + 1))
    }
  }

  // Typing searches after a pause. Enter and the button still submit at once,
  // and the form works as a plain GET without JavaScript.
  function updateField(field: keyof typeof fields, value: string) {
    const next = { ...fields, [field]: value }
    setFields(next)
    cancelPendingSearch()
    pendingSearch.current = setTimeout(() => {
      pendingSearch.current = undefined
      const href = searchHref({
        query: next.query.trim(),
        location: next.location.trim(),
        page: 1,
      })
      if (href === window.location.pathname + window.location.search) return
      setLoadingHrefs((hrefs) => [...hrefs, href])
      startTransition(() => router.replace(href, { scroll: false }))
    }, SEARCH_DELAY_MS)
  }

  return (
    <Form
      action="/"
      role="search"
      onSubmit={cancelPendingSearch}
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
            value={fields.query}
            onChange={(event) => updateField("query", event.target.value)}
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
            value={fields.location}
            onChange={(event) => updateField("location", event.target.value)}
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
