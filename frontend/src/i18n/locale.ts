import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"

export const LOCALES = ["en-GB", "pt-PT"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en-GB"

export const LOCALE_COOKIE = "NEXT_LOCALE"

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

// visitors choice cookie, then browser language
export function negotiateLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie
  const requested = new Negotiator({ headers: { "accept-language": acceptLanguage ?? "" } })
    .languages()
    .filter((tag) => tag !== "*")
  return match(requested, LOCALES, DEFAULT_LOCALE) as Locale
}
