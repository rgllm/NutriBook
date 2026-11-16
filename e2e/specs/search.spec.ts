import { expect, test, type Page } from "@playwright/test"

import { E2E_CITY } from "../support/stack"

async function search(page: Page, { query = "", location = "" }) {
  await page.goto("/")
  const form = page.getByRole("search")
  await form.getByLabel("Nutritionist or service").fill(query)
  await locationInput(page).fill(location)
  await form.getByRole("button", { name: "Search" }).click()
}

// Exact, because the "Use my location" button's label contains the word too.
const locationInput = (page: Page) => page.getByRole("search").getByLabel("Location", { exact: true })

// Each result card names its nutritionist in a level 2 heading.
const resultNames = (page: Page) => page.getByRole("main").getByRole("heading", { level: 2 })

test("finds a nutritionist by name, ignoring case and accents", async ({ page }) => {
  await search(page, { query: "joao", location: "viana do castelo" })

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`1 nutritionist in ${E2E_CITY}`)
  await expect(resultNames(page)).toHaveText(["João Gonçalves"])
  await expect(page).toHaveURL(/\?q=joao&location=viana\+do\+castelo$/)
})

test("finds nutritionists by the name of a service", async ({ page }) => {
  await search(page, { query: "sports nutrition", location: E2E_CITY })

  await expect(resultNames(page)).toHaveText(["João Gonçalves"])
  await expect(page.getByRole("main")).toContainText("Sports nutrition")
})

test("pages through the nutritionists in a city", async ({ page }) => {
  await search(page, { location: E2E_CITY })

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`6 nutritionists in ${E2E_CITY}`)
  await expect(resultNames(page)).toHaveCount(5)

  await page.getByRole("navigation", { name: "pagination" }).getByRole("link", { name: "Go to next page" }).click()

  await expect(resultNames(page)).toHaveCount(1)
  await expect(page).toHaveURL(/page=2/)
})

test("says when nobody matches and clears the search", async ({ page }) => {
  await search(page, { query: "acupuncture", location: E2E_CITY })

  await expect(page.getByText("No nutritionists found")).toBeVisible()
  await page.getByRole("link", { name: "Clear search" }).click()

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`6 nutritionists in ${E2E_CITY}`)
})

test("searches Braga when no location is given", async ({ page }) => {
  await search(page, {})

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/ in Braga$/)
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0)
})

test("falls back to Braga for an unknown location and says so", async ({ page }) => {
  await search(page, { location: "Atlantis" })

  await expect(page.getByRole("main").getByRole("alert")).toContainText("We don't know “Atlantis” yet")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/ in Braga$/)
})

test.describe("with location access", () => {
  // Just outside Viana do Castelo, nearer it than any city the demo seeds use.
  test.use({ permissions: ["geolocation"], geolocation: { latitude: 41.71, longitude: -8.8 } })

  test("fills in the nearest city and waits for the guest to search", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Use my location" }).click()

    await expect(locationInput(page)).toHaveValue(E2E_CITY)
    await expect(locationInput(page)).toBeFocused()
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole("search").getByRole("button", { name: "Search" }).click()

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`6 nutritionists in ${E2E_CITY}`)
  })
})

test("says so when location access is denied and leaves the location alone", async ({ page }) => {
  await page.goto("/?location=Porto")
  await page.getByRole("button", { name: "Use my location" }).click()

  await expect(page.getByText("Allow location access in your browser, or type a city.")).toBeVisible()
  await expect(locationInput(page)).toHaveValue("Porto")
})
