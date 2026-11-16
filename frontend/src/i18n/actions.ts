"use server"

import { cookies } from "next/headers"

import { isLocale, LOCALE_COOKIE } from "@/i18n/locale"

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

// Setting a cookie from an action re-renders the current page in the new locale.
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, { maxAge: ONE_YEAR_IN_SECONDS, path: "/", sameSite: "lax" })
}
