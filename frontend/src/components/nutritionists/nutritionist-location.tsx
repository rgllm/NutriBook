import { MapPinIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import type { Nutritionist } from "@/lib/api/nutritionists"

export function NutritionistLocation({ addresses }: Pick<Nutritionist, "addresses">) {
  const t = useTranslations("nutritionist")
  const format = useFormatter()

  return (
    <ul className="flex flex-col gap-3">
      {addresses.map(({ streetAddress, city, distanceKm }) => (
        <li key={`${city}|${streetAddress}`}>
          <address className="flex gap-2 not-italic">
            <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span>{streetAddress}</span>
              <span className="text-muted-foreground">{city}</span>
              {distanceKm !== null && (
                <span className="text-muted-foreground">
                  {t("distance", { distance: format.number(distanceKm, "distance") })}
                </span>
              )}
            </span>
          </address>
        </li>
      ))}
    </ul>
  )
}
