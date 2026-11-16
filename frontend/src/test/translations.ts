import { createFormatter, createTranslator } from "next-intl"

import { formats, PRACTICE_TIME_ZONE } from "@/i18n/formats"
import type { Locale } from "@/i18n/locale"
import { MESSAGES } from "@/i18n/messages"

export const translatorFor = (locale: Locale) =>
  createTranslator({ locale, messages: MESSAGES[locale], formats, timeZone: PRACTICE_TIME_ZONE })

export const formatterFor = (locale: Locale) =>
  createFormatter({ locale, formats, timeZone: PRACTICE_TIME_ZONE })

// Stands in for next-intl/server in tests of Server Actions, in English.
export const getTranslations = async (namespace: string) =>
  createTranslator({
    locale: "en-GB",
    messages: MESSAGES["en-GB"],
    namespace: namespace as never,
    formats,
    timeZone: PRACTICE_TIME_ZONE,
  })
