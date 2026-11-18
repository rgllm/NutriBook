import { expect, test } from "@playwright/test"

test("old nutritionist page links move permanently to /professionals", async ({ request }) => {
  const response = await request.get("/nutritionists/7/requests?from=email", { maxRedirects: 0 })

  expect(response.status()).toBe(301)
  expect(response.headers().location).toBe("/professionals/7/requests?from=email")
})
