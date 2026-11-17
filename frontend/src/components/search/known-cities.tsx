import { useTranslations } from "next-intl"

import { FieldDescription } from "@/components/ui/field"
import type { Locations } from "@/lib/api/locations"

// The ids are the ones SearchForm's location input points at.
export function KnownCities({ locations }: { locations: Locations }) {
  const t = useTranslations("search")

  return (
    <>
      <FieldDescription id="search-location-hint" className="px-3 text-xs text-brand-soft">
        {t("locationHint", { city: locations.default })}
      </FieldDescription>
      <datalist id="known-cities">
        {locations.locations.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </>
  )
}
