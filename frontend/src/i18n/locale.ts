import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"

// Full tags rather than "en" and "pt", because Intl formats dates and prices
// by them: plain "pt" formats euros the Brazilian way.
export const LOCALES = ["en-GB", "pt-PT"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en-GB"

export const LOCALE_COOKIE = "NEXT_LOCALE"

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

// The visitor's choice in the cookie wins; otherwise the browser's languages,
// from an Accept-Language header such as "pt-BR,pt;q=0.9,en;q=0.8".
export function negotiateLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie
  const requested = new Negotiator({ headers: { "accept-language": acceptLanguage ?? "" } })
    .languages()
    .filter((tag) => tag !== "*")
  return match(requested, LOCALES, DEFAULT_LOCALE) as Locale
}
