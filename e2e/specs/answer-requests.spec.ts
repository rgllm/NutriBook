import { expect, newGuest, test } from "../support/fixtures"
import { pendingRequest } from "../support/pages"
import { upcomingMonday } from "../support/schedule"

const NOT_ACCEPTED = /^Your appointment request with .+ was not accepted$/

test("accepting a request rejects the requests it overlaps and emails every guest in their language", async ({
  page,
  api,
  mailbox,
}) => {
  const nutritionist = await api.nutritionist("Rui Peixoto")
  const day = upcomingMonday(test.info().retry)
  const accepted = newGuest("Ana")
  const sameStart = newGuest("Bruno")
  const longerEarlier = newGuest("Clara")
  const adjacent = newGuest("Duarte")

  // 10:00 to 11:00 is accepted. The 30-minute request at 10:00 and the
  // 90-minute request from 09:00 overlap it; the one from 11:00 only touches it.
  await api.requestAppointment(nutritionist, { service: "First appointment", guest: accepted, day, time: "10:00" })
  await api.requestAppointment(nutritionist, {
    service: "Follow-up",
    guest: sameStart,
    day,
    time: "10:00",
    language: "pt-PT",
  })
  await api.requestAppointment(nutritionist, { service: "Extended assessment", guest: longerEarlier, day, time: "09:00" })
  await api.requestAppointment(nutritionist, { service: "Follow-up", guest: adjacent, day, time: "11:00" })

  await page.goto(`/professionals/${nutritionist.id}/requests`)
  await page.getByRole("button", { name: `Accept the request from ${accepted.name}` }).click()

  await expect(page.getByText(`Accepted ${accepted.name}'s request. 2 overlapping requests were rejected.`)).toBeVisible()
  for (const answered of [accepted, sameStart, longerEarlier]) {
    await expect(pendingRequest(page, answered)).toHaveCount(0)
  }
  await expect(pendingRequest(page, adjacent)).toBeVisible()

  const [confirmation] = await mailbox.emailsTo(accepted, 1)
  expect(confirmation.subject).toBe(`Your appointment with ${nutritionist.name} is confirmed`)
  const [englishRejection] = await mailbox.emailsTo(longerEarlier, 1)
  expect(englishRejection.subject).toMatch(NOT_ACCEPTED)
  expect(englishRejection.text).toContain(`${nutritionist.name} can't take this appointment request.`)
  const [portugueseRejection] = await mailbox.emailsTo(sameStart, 1)
  expect(portugueseRejection.subject).toBe(`O seu pedido de consulta com ${nutritionist.name} não foi aceite`)
  expect(portugueseRejection.text).toContain(`${nutritionist.name} não aceitou este pedido de consulta.`)
  await mailbox.emailsTo(adjacent, 0)
})

test("rejecting a request emails the guest that it was declined", async ({ page, api, mailbox }) => {
  const nutritionist = await api.nutritionist("Marta Simões")
  const guest = newGuest("Eva")
  await api.requestAppointment(nutritionist, {
    service: "First appointment",
    guest,
    day: upcomingMonday(test.info().retry),
    time: "15:00",
  })

  await page.goto(`/professionals/${nutritionist.id}/requests`)
  await page.getByRole("button", { name: `Reject the request from ${guest.name}` }).click()

  await expect(pendingRequest(page, guest)).toHaveCount(0)
  await expect(page.getByText("No pending requests")).toBeVisible()

  const [rejection] = await mailbox.emailsTo(guest, 1)
  expect(rejection.subject).toMatch(NOT_ACCEPTED)
  expect(rejection.text).toContain(`${nutritionist.name} can't take this appointment request`)
})
