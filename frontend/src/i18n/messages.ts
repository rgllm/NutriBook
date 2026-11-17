import type { Locale } from "@/i18n/locale"
import en from "../../languages/en-GB.json"
import pt from "../../languages/pt-PT.json"

export type Messages = typeof en

export const MESSAGES: Record<Locale, Messages> = { "en-GB": en, "pt-PT": pt }
