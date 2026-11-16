import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { formats, PRACTICE_TIME_ZONE } from "@/i18n/formats"
import { LOCALE_COOKIE, negotiateLocale } from "@/i18n/locale"
import { MESSAGES } from "@/i18n/messages"

export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  const locale = negotiateLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"))

  return { locale, messages: MESSAGES[locale], timeZone: PRACTICE_TIME_ZONE, formats }
})
