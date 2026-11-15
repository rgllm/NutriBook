import { MapPinIcon } from "lucide-react"

import type { Nutritionist } from "@/lib/api/nutritionists"

export function NutritionistLocation({
  addresses,
  city,
}: Pick<Nutritionist, "addresses" | "city">) {
  return (
    <ul className="flex flex-col gap-3">
      {addresses.map((address) => (
        <li key={address}>
          <address className="flex gap-2 not-italic">
            <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span>{address}</span>
              <span className="text-muted-foreground">{city}</span>
            </span>
          </address>
        </li>
      ))}
    </ul>
  )
}
