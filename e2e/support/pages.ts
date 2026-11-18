import type { Page } from "@playwright/test"

import type { Guest } from "./fixtures"
import type { IsoDay } from "./schedule"

// A guest's card on a nutritionist's pending requests page.
export const pendingRequest = (page: Page, guest: Guest) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: guest.name }) })

// The calendar names each day the way date-fns's British "PPPP" format writes
// it, for example "Tuesday, 24 November 2026".
export function calendarDay(day: IsoDay) {
  const date = new Date(`${day}T12:00:00Z`)
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(date)
  return `${part({ weekday: "long" })}, ${part({ day: "numeric", month: "long", year: "numeric" })}`
}
