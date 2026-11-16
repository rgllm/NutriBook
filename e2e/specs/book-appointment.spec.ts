import { expect, newGuest, test } from "../support/fixtures"
import { pendingRequest } from "../support/pages"
import { addDays, lisbonInstant, upcomingMonday, type IsoDay } from "../support/schedule"
import { E2E_CITY } from "../support/stack"

// The calendar names each day the way date-fns's British "PPPP" format writes
// it, for example "Tuesday, 24 November 2026".
function calendarDay(day: IsoDay) {
  const date = new Date(`${day}T12:00:00Z`)
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(date)
  return `${part({ weekday: "long" })}, ${part({ day: "numeric", month: "long", year: "numeric" })}`
}

// How the confirmation names the day, for example "Tuesday 24 November".
const spokenDay = (day: IsoDay) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${day}T12:00:00Z`),
  )

test("a guest requests an appointment and the nutritionist sees it", async ({ page, api }) => {
  const nutritionist = await api.nutritionist("Inês Araújo")
  const guest = newGuest("Carla")
  const monday = upcomingMonday(test.info().retry)
  const tuesday = addDays(monday, 1)
  // The browser believes it is Tuesday 12:30 in Lisbon, which is still early
  // morning in its own Los Angeles zone, so the calendar and the time slots
  // must both follow Lisbon.
  await page.clock.setFixedTime(lisbonInstant(tuesday, "12:30"))

  await page.goto(`/?${new URLSearchParams({ q: nutritionist.name, location: E2E_CITY })}`)
  await page.getByRole("button", { name: "Schedule appointment" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toHaveAccessibleName("Schedule an appointment")

  await dialog.getByRole("button", { name: "Request appointment" }).click()
  await expect(dialog).toContainText("Enter your name.")
  await expect(dialog).toContainText("Enter your email.")
  await expect(dialog).toContainText("Choose a service.")
  await expect(dialog).toContainText("Pick a day and time.")

  await dialog.getByLabel("Your name").fill(guest.name)
  await dialog.getByLabel("Email").fill(guest.email)
  const service = dialog.getByRole("combobox", { name: "Service" })
  await service.click()
  await expect(page.getByRole("option")).toHaveText([
    "First appointment · €35 · 60 min",
    "Follow-up · €20 · 30 min",
  ])
  await page.getByRole("option", { name: "Follow-up · €20 · 30 min", exact: true }).click()
  await expect(service).toContainText("Follow-up · €20 · 30 min")

  await expect(dialog.getByRole("button", { name: calendarDay(monday) })).toBeDisabled()
  await dialog.getByRole("button", { name: calendarDay(tuesday) }).click()
  await expect(dialog.getByRole("button", { name: "12:00", exact: true })).toBeDisabled()
  await dialog.getByRole("button", { name: "14:00", exact: true }).click()
  await dialog.getByRole("button", { name: "Request appointment" }).click()

  await expect(dialog).toHaveAccessibleName("Appointment requested")
  await expect(dialog).toContainText(`Follow-up on ${spokenDay(tuesday)} at 14:00`)
  await expect(dialog).toContainText(guest.email)

  await page.goto(`/nutritionists/${nutritionist.id}/requests`)
  const request = pendingRequest(page, guest)
  await expect(request).toContainText("Follow-up")
  await expect(request).toContainText(guest.email)
  await expect(request).toContainText("14:00–14:30")
})
