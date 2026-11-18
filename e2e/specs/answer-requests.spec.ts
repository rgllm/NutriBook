import { expect, newGuest, test } from "../support/fixtures"
import { pendingRequest } from "../support/pages"
import { addDays, upcomingMonday } from "../support/schedule"

const NOT_ACCEPTED = /^Your appointment request with .+ was not accepted$/

test("accepting a request lists the requests it overlaps, rejects them, and emails every guest in their language", async ({
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

  await page.goto(`/nutritionists/${nutritionist.id}/requests`)
  await expect(pendingRequest(page, accepted)).toContainText("Overlaps 2 requests")
  await expect(pendingRequest(page, adjacent)).not.toContainText("Overlaps")
  await page.getByRole("button", { name: `Accept the request from ${accepted.name}` }).click()

  // The browser runs in Los Angeles; the times are Lisbon's.
  const confirmation = page.getByRole("dialog", { name: `Accept ${accepted.name}'s request?` })
  await expect(confirmation.getByRole("listitem")).toHaveText([
    new RegExp(`${longerEarlier.name}.*Extended assessment, 09:00–10:30`),
    new RegExp(`${sameStart.name}.*Follow-up, 10:00–10:30`),
  ])
  await confirmation.getByRole("button", { name: "Accept and reject 2" }).click()

  await expect(page.getByText(`Accepted ${accepted.name}'s request. 2 overlapping requests were rejected.`)).toBeVisible()
  for (const answered of [accepted, sameStart, longerEarlier]) {
    await expect(pendingRequest(page, answered)).toHaveCount(0)
  }
  await expect(pendingRequest(page, adjacent)).toBeVisible()

  const [acceptance] = await mailbox.emailsTo(accepted, 1)
  expect(acceptance.subject).toBe(`Your appointment with ${nutritionist.name} is confirmed`)
  const [englishRejection] = await mailbox.emailsTo(longerEarlier, 1)
  expect(englishRejection.subject).toMatch(NOT_ACCEPTED)
  expect(englishRejection.text).toContain(`${nutritionist.name} can't take this appointment request.`)
  const [portugueseRejection] = await mailbox.emailsTo(sameStart, 1)
  expect(portugueseRejection.subject).toBe(`O seu pedido de consulta com ${nutritionist.name} não foi aceite`)
  expect(portugueseRejection.text).toContain(`${nutritionist.name} não aceitou este pedido de consulta.`)
  await mailbox.emailsTo(adjacent, 0)
})

test("accepting from a stale list rejects no request the nutritionist was not shown", async ({ page, api, mailbox }) => {
  const nutritionist = await api.nutritionist("Rui Peixoto")
  const day = addDays(upcomingMonday(test.info().retry), 1)
  const accepted = newGuest("Gil")
  const unseen = newGuest("Helena")
  await api.requestAppointment(nutritionist, { service: "First appointment", guest: accepted, day, time: "15:00" })

  await page.goto(`/nutritionists/${nutritionist.id}/requests`)
  await expect(pendingRequest(page, accepted)).not.toContainText("Overlaps")
  await api.requestAppointment(nutritionist, { service: "Follow-up", guest: unseen, day, time: "15:00" })
  await page.getByRole("button", { name: `Accept the request from ${accepted.name}` }).click()

  await expect(page.getByText("New requests overlap this one. Check the updated list and accept again.")).toBeVisible()
  await expect(pendingRequest(page, accepted)).toContainText("Overlaps 1 request")
  await expect(pendingRequest(page, unseen)).toBeVisible()
  await mailbox.emailsTo(unseen, 0)

  await page.getByRole("button", { name: `Accept the request from ${accepted.name}` }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Accept and reject 1" }).click()

  await expect(page.getByText(`Accepted ${accepted.name}'s request. 1 overlapping request was rejected.`)).toBeVisible()
  await expect(pendingRequest(page, unseen)).toHaveCount(0)
  await mailbox.emailsTo(unseen, 1)
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

  await page.goto(`/nutritionists/${nutritionist.id}/requests`)
  await page.getByRole("button", { name: `Reject the request from ${guest.name}` }).click()

  await expect(pendingRequest(page, guest)).toHaveCount(0)
  await expect(page.getByText("No pending requests")).toBeVisible()

  const [rejection] = await mailbox.emailsTo(guest, 1)
  expect(rejection.subject).toMatch(NOT_ACCEPTED)
  expect(rejection.text).toContain(`${nutritionist.name} can't take this appointment request`)
})
