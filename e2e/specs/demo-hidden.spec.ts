import { expect, test } from "@playwright/test"

test("production pages hide development demo links", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 2 })).not.toHaveCount(0)
  await expect(page.getByRole("link", { name: /Demo inbox|Mailpit inbox/ })).toHaveCount(0)
  await expect(page.getByRole("contentinfo")).toHaveCount(0)
})
