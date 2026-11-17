import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

export function ResultsHeading({
  count,
  city,
  query,
  children,
}: {
  count: number
  // Null when a nearby search covers every city.
  city: string | null
  query: string
  children?: ReactNode
}) {
  const t = useTranslations("search")

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-heading text-balance">
        {city === null ? t("headingNearby", { count }) : t("heading", { count, city })}
      </h1>
      {query && <p className="text-muted-foreground">{t("matching", { query })}</p>}
      {children}
    </div>
  )
}
