import { getLocale, getTranslations } from "next-intl/server"

import { setLocale } from "@/i18n/actions"
import { LOCALES, type Locale } from "@/i18n/locale"
import { cn } from "@/lib/utils"

// Each language is named in itself, so a visitor finds theirs whatever the
// page's current language.
const LANGUAGES: Record<Locale, { code: string; name: string }> = {
  "en-GB": { code: "EN", name: "English" },
  "pt-PT": { code: "PT", name: "Português" },
}

export async function LocaleSwitcher() {
  const [current, t] = await Promise.all([getLocale(), getTranslations("SiteHeader")])

  return (
    <form action={setLocale} aria-label={t("language")} className="flex">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="submit"
          name="locale"
          value={locale}
          lang={locale}
          aria-label={LANGUAGES[locale].name}
          aria-pressed={locale === current}
          className={cn(
            "inline-flex h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-medium underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            locale === current
              ? "underline"
              : "text-primary-foreground/70 hover:text-primary-foreground",
          )}
        >
          {LANGUAGES[locale].code}
        </button>
      ))}
    </form>
  )
}
