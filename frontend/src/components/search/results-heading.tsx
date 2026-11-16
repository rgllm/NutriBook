import { useTranslations } from "next-intl"

export function ResultsHeading({
  count,
  city,
  query,
}: {
  count: number
  city: string
  query: string
}) {
  const t = useTranslations("search")

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-heading text-balance">
        {t("heading", { count, city })}
      </h1>
      {query && <p className="text-muted-foreground">{t("matching", { query })}</p>}
    </div>
  )
}
