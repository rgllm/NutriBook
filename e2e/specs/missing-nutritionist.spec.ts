import { expect, test } from "@playwright/test"

const MISSING_IDS = [
  ["a malformed id", "1abc"],
  ["id zero", "0"],
  ["an id with a leading zero", "01"],
  ["a negative id", "-1"],
  ["an unknown id", "999999999"],
  ["an id past the database's integer range", "9".repeat(20)],
] as const

// The page shell, and with it a 200, goes out before the requests list learns
// the nutritionist is missing, so these pages are soft 404s marked noindex.
for (const [label, id] of MISSING_IDS) {
  test(`the requests page for ${label} shows the not-found page`, async ({ page }) => {
    const response = await page.goto(`/nutritionists/${id}/requests`)

    expect(response?.status()).toBe(200)
    await expect(page.getByText("Page not found")).toBeVisible()
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/)
  })
}
