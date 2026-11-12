import { MapPinIcon } from "lucide-react"

import type { Nutritionist } from "@/lib/nutritionists"

export function NutritionistLocation({
  address,
  city,
}: Pick<Nutritionist, "address" | "city">) {
  return (
    <address className="flex gap-2 not-italic">
      <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="flex flex-col">
        <span>{address}</span>
        <span className="text-muted-foreground">{city}</span>
      </span>
    </address>
  )
}
