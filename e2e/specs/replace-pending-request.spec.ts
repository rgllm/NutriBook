import { expect, newGuest, test } from "../support/fixtures"
import { pendingRequest } from "../support/pages"
import { upcomingMonday } from "../support/schedule"

test("a guest's new request replaces their pending one, even with another nutritionist", async ({ page, api }) => {
  const first = await api.nutritionist("Tiago Brandão")
  const second = await api.nutritionist("Sofia Leal")
  const guest = newGuest("Filipa")
  const day = upcomingMonday(test.info().retry)

  await api.requestAppointment(first, { service: "First appointment", guest, day, time: "10:00" })
  await page.goto(`/professionals/${first.id}/requests`)
  await expect(pendingRequest(page, guest)).toBeVisible()

  await api.requestAppointment(second, { service: "First appointment", guest, day, time: "16:00" })

  await page.reload()
  await expect(pendingRequest(page, guest)).toHaveCount(0)
  await page.goto(`/professionals/${second.id}/requests`)
  await expect(pendingRequest(page, guest)).toContainText("16:00–17:00")
})
