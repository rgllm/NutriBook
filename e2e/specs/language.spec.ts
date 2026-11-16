import { expect, test } from "@playwright/test"

import { E2E_CITY } from "../support/stack"

const searchCity = `/?${new URLSearchParams({ location: E2E_CITY })}`

test("a visitor switches to Portuguese, keeps it across visits, and switches back", async ({ page }) => {
  await page.goto(searchCity)
  const heading = page.getByRole("heading", { level: 1 })
  await expect(heading).toHaveText(`6 nutritionists in ${E2E_CITY}`)

  await page.getByRole("button", { name: "Português" }).click()

  await expect(heading).toHaveText(`6 nutricionistas em ${E2E_CITY}`)
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT")
  await expect(page).toHaveURL(searchCity)

  await page.reload()
  await expect(heading).toHaveText(`6 nutricionistas em ${E2E_CITY}`)

  await page.getByRole("button", { name: "English" }).click()
  await expect(heading).toHaveText(`6 nutritionists in ${E2E_CITY}`)
})

test.describe("with a Portuguese browser", () => {
  test.use({ locale: "pt-PT" })

  test("shows Portuguese without asking, API errors included", async ({ page }) => {
    await page.goto(searchCity)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`6 nutricionistas em ${E2E_CITY}`)

    await page.getByRole("button", { name: "Marcar consulta" }).first().click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Pedir consulta" }).click()

    await expect(dialog).toContainText("Indique o seu nome.")
    await expect(dialog).toContainText("Escolha um dia e uma hora.")
  })
})
