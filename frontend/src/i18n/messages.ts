import type { Locale } from "@/i18n/locale"
import en from "../../messages/en-GB.json"
import pt from "../../messages/pt-PT.json"

export type Messages = typeof en

// Typed against the English file, so a message missing in Portuguese fails tsc.
export const MESSAGES: Record<Locale, Messages> = { "en-GB": en, "pt-PT": pt }
