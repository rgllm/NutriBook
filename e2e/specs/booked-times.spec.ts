import type { Page } from "@playwright/test"

import { expect, newGuest, test, type Guest } from "../support/fixtures"
import { calendarDay } from "../support/pages"
import { addDays, upcomingMonday } from "../support/schedule"
import { E2E_CITY } from "../support/stack"

async function accept(page: Page, nutritionistId: number, guest: Guest) {
  await page.goto(`/nutritionists/${nutritionistId}/requests`)
  await page.getByRole("button", { name: `Accept the request from ${guest.name}` }).click()
  await expect(page.getByText(`Accepted ${guest.name}'s request.`)).toBeVisible()
}

test("the booking calendar strikes out times the nutritionist has accepted, for the chosen service", async ({
  page,
  api,
}) => {
  const nutritionist = await api.nutritionist("Rui Peixoto")
  // Wednesday, so the Monday requests answer-requests.spec.ts accepts for him do not interfere.
  const day = addDays(upcomingMonday(test.info().retry), 2)
  const morning = newGuest("Helena")
  const afternoon = newGuest("Ivo")
  const guest = newGuest("Joana")

  await api.requestAppointment(nutritionist, { service: "First appointment", guest: morning, day, time: "10:00" })
  await accept(page, nutritionist.id, morning)

  await page.goto(`/?${new URLSearchParams({ q: nutritionist.name, location: E2E_CITY })}`)
  await page.getByRole("button", { name: `Schedule appointment with ${nutritionist.name}` }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Your name").fill(guest.name)
  await dialog.getByLabel("Email").fill(guest.email)
  const service = dialog.getByRole("combobox", { name: "Service" })
  const slot = (time: string) => dialog.getByRole("button", { name: time, exact: true })
  const booked = (time: string) => dialog.getByRole("button", { name: `${time}, already booked` })

  // 10:00 to 11:00 is accepted. A 30-minute appointment fits right before and after it.
  await service.click()
  await page.getByRole("option", { name: "Follow-up · €20 · 30 min", exact: true }).click()
  await dialog.getByRole("button", { name: calendarDay(day) }).click()
  await expect(booked("10:00")).toBeDisabled()
  await expect(slot("09:00")).toBeEnabled()
  await expect(slot("11:00")).toBeEnabled()
  await slot("09:00").click()
  await expect(slot("09:00")).toHaveAttribute("aria-pressed", "true")

  // A 90-minute appointment from 09:00 would run into it, so the pick is dropped.
  await service.click()
  await page.getByRole("option", { name: "Extended assessment · €60 · 90 min", exact: true }).click()
  await expect(booked("09:00")).toBeDisabled()
  await expect(booked("09:00")).not.toHaveAttribute("aria-pressed", "true")
  await expect(slot("11:00")).toBeEnabled()

  // While the dialog stays open, the nutritionist accepts 14:00 in another tab.
  await api.requestAppointment(nutritionist, { service: "First appointment", guest: afternoon, day, time: "14:00" })
  await accept(await page.context().newPage(), nutritionist.id, afternoon)

  await slot("14:00").click()
  await dialog.getByRole("button", { name: "Request appointment" }).click()
  await expect(dialog).toContainText("This time is no longer available. Pick another.")
  await expect(booked("14:00")).toBeDisabled()
  await expect(dialog).toHaveAccessibleName("Schedule an appointment")
})
