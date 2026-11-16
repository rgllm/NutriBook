"use client"

import { useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setLocale } from "@/i18n/actions"
import { isLocale, LOCALES, type Locale } from "@/i18n/locale"

// Each language is named in itself, so a visitor finds theirs whatever the
// page's current language. The name stays next to the flag because Windows
// shows flag emojis as two letters.
const LANGUAGES: Record<Locale, { flag: string; name: string }> = {
  "en-GB": { flag: "🇬🇧", name: "English" },
  "pt-PT": { flag: "🇵🇹", name: "Português" },
}

const ITEMS = LOCALES.map((locale) => ({ value: locale, label: LANGUAGES[locale].name }))

export function LocaleSwitcher() {
  const current = useLocale()
  const t = useTranslations("SiteHeader")
  const [isPending, startTransition] = useTransition()

  const choose = (locale: string | null) => {
    if (!isLocale(locale) || locale === current) return
    startTransition(() => setLocale(locale))
  }

  return (
    <Select items={ITEMS} value={current} onValueChange={choose} disabled={isPending}>
      <SelectTrigger size="sm" aria-label={t("language")} className="border-transparent text-sm hover:bg-white/10 [&_svg]:text-primary-foreground">
        <SelectValue>{(locale: Locale) => <LanguageLabel locale={locale} />}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale} lang={locale}>
            <LanguageLabel locale={locale} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function LanguageLabel({ locale }: { locale: Locale }) {
  return (
    <span lang={locale} className="flex items-center gap-2">
      <span aria-hidden>{LANGUAGES[locale].flag}</span>
      {LANGUAGES[locale].name}
    </span>
  )
}
