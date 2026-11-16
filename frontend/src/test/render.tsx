import type { ReactElement, ReactNode } from "react"
import { render as renderComponent } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"

import { formats, PRACTICE_TIME_ZONE } from "@/i18n/formats"
import { MESSAGES } from "@/i18n/messages"

function EnglishMessages({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="en-GB"
      messages={MESSAGES["en-GB"]}
      formats={formats}
      timeZone={PRACTICE_TIME_ZONE}
    >
      {children}
    </NextIntlClientProvider>
  )
}

export function render(ui: ReactElement) {
  return renderComponent(ui, { wrapper: EnglishMessages })
}
