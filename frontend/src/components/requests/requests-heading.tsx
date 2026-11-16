import { useTranslations } from "next-intl"

export function RequestsHeading({ nutritionistName }: { nutritionistName: string }) {
  const t = useTranslations("requests")

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-heading text-balance">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description", { name: nutritionistName })}</p>
    </div>
  )
}
