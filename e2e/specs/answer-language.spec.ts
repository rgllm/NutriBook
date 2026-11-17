import { expect, newGuest, test } from "../support/fixtures"
import { pendingRequest } from "../support/pages"
import { upcomingMonday } from "../support/schedule"
import { E2E_CITY } from "../support/stack"

test.use({ locale: "pt-PT" })

test("a guest who books in Portuguese is answered in Portuguese, even after switching another tab to English", async ({
  page,
  api,
  mailbox,
}) => {
  const nutritionist = await api.nutritionist("João Gonçalves")
  const guest = newGuest("Leonor")
  const monday = upcomingMonday(test.info().retry)
  const day = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${monday}T12:00:00Z`))

  await page.goto(`/?${new URLSearchParams({ q: nutritionist.name, location: E2E_CITY })}`)
  await page.getByRole("button", { name: "Marcar consulta" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("O seu nome").fill(guest.name)
  await dialog.getByLabel("Email").fill(guest.email)
  await dialog.getByRole("combobox", { name: "Serviço" }).click()
  await page.getByRole("option", { name: /^First appointment/ }).click()
  await dialog.getByRole("button", { name: day }).click()
  await dialog.getByRole("button", { name: "11:00", exact: true }).click()

  const otherTab = await page.context().newPage()
  await otherTab.goto(`/?${new URLSearchParams({ location: E2E_CITY })}`)
  await otherTab.getByRole("combobox", { name: "Idioma" }).click()
  await otherTab.getByRole("option", { name: "English" }).click()
  await expect(otherTab.getByRole("heading", { level: 1 })).toHaveText(`6 nutritionists in ${E2E_CITY}`)
  await otherTab.close()

  await dialog.getByRole("button", { name: "Pedir consulta" }).click()
  await expect(dialog).toHaveAccessibleName("Consulta pedida")

  await page.goto(`/nutritionists/${nutritionist.id}/requests`)
  await pendingRequest(page, guest).getByRole("button", { name: `Accept the request from ${guest.name}` }).click()
  await expect(pendingRequest(page, guest)).toHaveCount(0)

  const [confirmation] = await mailbox.emailsTo(guest, 1)
  expect(confirmation.subject).toBe(`A sua consulta com ${nutritionist.name} está confirmada`)
  expect(confirmation.text).toContain(`${nutritionist.name} aceitou o seu pedido de consulta.`)
  expect(confirmation.text).toContain("(hora de Lisboa)")
})
