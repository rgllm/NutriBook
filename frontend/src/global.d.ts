import type { formats } from "@/i18n/formats"
import type { Locale } from "@/i18n/locale"
import type { Messages } from "@/i18n/messages"

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: typeof formats
  }
}
