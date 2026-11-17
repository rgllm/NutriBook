import { useTranslations } from "next-intl"

export function DemoFooter() {
  const t = useTranslations("demo")
  if (process.env.NODE_ENV !== "development") return null

  return (
    <footer className="border-t border-border text-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        <p className="text-muted-foreground">{t("notice")}</p>
        <a
          href={process.env.MAILPIT_URL ?? "http://localhost:8025"}
          className="inline-flex min-h-11 shrink-0 items-center self-start rounded-sm text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t("mailpit")}
        </a>
      </div>
    </footer>
  )
}
