import type { Page } from "@playwright/test"

import type { Guest } from "./fixtures"

// A guest's card on a nutritionist's pending requests page.
export const pendingRequest = (page: Page, guest: Guest) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: guest.name }) })
