// Full tags rather than "en" and "pt", because Intl formats dates and prices
// by them: plain "pt" formats euros the Brazilian way.
export const LOCALES = ["en-GB", "pt-PT"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en-GB"

export const LOCALE_COOKIE = "NEXT_LOCALE"

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

const language = (tag: string) => tag.split("-")[0].toLowerCase()

// The locale whose language the visitor prefers most, from an Accept-Language
// header such as "pt-BR,pt;q=0.9,en;q=0.8".
function preferredLocale(acceptLanguage: string): Locale | undefined {
  const ranked = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";")
      const quality = params.find((param) => param.trim().startsWith("q="))
      return { tag: tag.trim(), weight: quality ? Number(quality.trim().slice(2)) : 1 }
    })
    .filter(({ tag, weight }) => tag && weight > 0)
    .sort((a, b) => b.weight - a.weight)

  for (const { tag } of ranked) {
    const match = LOCALES.find((locale) => language(locale) === language(tag))
    if (match) return match
  }
}

// The visitor's choice in the cookie wins; otherwise the browser's languages.
export function negotiateLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie
  return preferredLocale(acceptLanguage ?? "") ?? DEFAULT_LOCALE
}
