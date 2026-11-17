import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { expect, test } from "../support/fixtures"
import { pendingRequest } from "../support/pages"
import { BACKEND_PORT, COMPOSE_PROJECT_NAME, MAILPIT_PORT, MAILPIT_URL } from "../support/stack"

const root = fileURLToPath(new URL("../..", import.meta.url))
const env = {
  ...process.env,
  COMPOSE_PROJECT_NAME,
  COMPOSE_FILE: "compose.yaml:e2e/compose.yaml",
  BACKEND_PORT: String(BACKEND_PORT),
  MAILPIT_PORT: String(MAILPIT_PORT),
}
const danilo = { name: "Danilo Santos", email: "danilo.santos@example.com" }
const nataniel = { name: "Nataniel Batista", email: "nataniel.batista@example.com" }
const hugo = { name: "Hugo Estéves", email: "hugo.esteves@example.com" }
const eduarda = { name: "Eduarda Souza", email: "eduarda.souza@example.com" }

function run(command: string, args: string[]) {
  return execFileSync(command, args, { cwd: root, env, encoding: "utf8", timeout: 120_000 })
}

test("resets an answered demo and navigates to current inbox IDs", async ({ page, mailbox }) => {
  test.setTimeout(180_000)

  await page.goto("/?q=Aline&location=Braga")
  await expect(page.getByRole("link", { name: /Are you a nutrition professional/ })).toHaveAttribute("href", "https://nutrium.com/")
  await expect(page.getByRole("link", { name: "Demo inbox for Aline Moreira", exact: true })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath("demo-search.png"), fullPage: true })
  await page.getByRole("link", { name: "Demo inbox for Aline Moreira", exact: true }).click()
  const originalInbox = page.url()
  await expect(page.getByRole("listitem")).toHaveCount(4)

  await page.getByRole("button", { name: `Accept the request from ${danilo.name}`, exact: true }).click()
  await expect(pendingRequest(page, danilo)).toHaveCount(0)
  await expect(pendingRequest(page, nataniel)).toHaveCount(0)
  for (const guest of [hugo, eduarda]) {
    await page.getByRole("button", { name: `Reject the request from ${guest.name}`, exact: true }).click()
    await expect(pendingRequest(page, guest)).toHaveCount(0)
  }
  await expect(page.getByText("No pending requests", { exact: true })).toBeVisible()
  for (const guest of [danilo, nataniel, hugo, eduarda]) await mailbox.emailsTo(guest, 1)

  run("docker", ["compose", "exec", "-T", "backend", "bin/rails", "db:seed"])
  await page.reload()
  await expect(page.getByText("No pending requests", { exact: true })).toBeVisible()

  run("docker", ["compose", "exec", "-T", "backend", "bin/rails", "runner",
    'AppointmentAnswerEmailJob.set(wait: 1.hour).perform_later(AppointmentRequest.find_by!(guest_email: "danilo.santos@example.com").id)',
  ])

  for (let reset = 0; reset < 2; reset++) {
    run("pnpm", ["demo:reset"])
    const state = run("docker", ["compose", "exec", "-T", "backend", "bin/rails", "runner",
      'puts({ requests: AppointmentRequest.order(:id).pluck(:status, :answered_at, :answer_notified_at, :rejection_reason), jobs: SolidQueue::Job.where(class_name: "AppointmentAnswerEmailJob").count }.to_json)',
    ])
    expect(JSON.parse(state)).toEqual({ requests: Array.from({ length: 4 }, () => ["pending", null, null, null]), jobs: 0 })
    await page.goto("/?q=Aline&location=Braga")
    await page.getByRole("link", { name: "Demo inbox for Aline Moreira", exact: true }).click()
    await expect(page).not.toHaveURL(originalInbox)
    await expect(page.getByRole("listitem")).toHaveCount(4)
    for (const guest of [danilo, nataniel, hugo, eduarda]) {
      await expect(pendingRequest(page, guest)).toBeVisible()
      const startsAt = await pendingRequest(page, guest).locator("time").getAttribute("datetime")
      expect(Date.parse(startsAt ?? "")).toBeGreaterThan(Date.now())
    }
    await expect(pendingRequest(page, danilo)).toContainText("10:00")
    await expect(pendingRequest(page, danilo)).toContainText("11:00")
    await expect(pendingRequest(page, nataniel)).toContainText("10:30")
  }
  await page.screenshot({ path: test.info().outputPath("demo-inbox.png"), fullPage: true })

  await page.getByRole("button", { name: `Accept the request from ${danilo.name}`, exact: true }).click()
  await expect(pendingRequest(page, nataniel)).toHaveCount(0)
  const confirmations = await mailbox.emailsTo(danilo, 2)
  expect(confirmations.every((email) => email.subject.includes("is confirmed"))).toBe(true)
  const rejections = await mailbox.emailsTo(nataniel, 2)
  expect(rejections.every((email) => email.text.includes("accepted another appointment at the same time"))).toBe(true)

  await page.goto("/?q=Silas&location=Braga")
  await page.getByRole("link", { name: "Demo inbox for Silas Saraiva", exact: true }).click()
  await expect(page.getByText("No pending requests", { exact: true })).toBeVisible()
  const mailpit = page.getByRole("link", { name: "Mailpit inbox", exact: true })
  await expect(mailpit).toHaveAttribute("href", MAILPIT_URL)
  await mailpit.focus()
  await expect(mailpit).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(new URL("/", MAILPIT_URL).href)
  await expect(page).toHaveTitle(/Mailpit/)
})

test("shows translated demo navigation on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/?q=Aline&location=Braga")
  await page.getByRole("combobox", { name: "Language", exact: true }).click()
  await page.getByRole("option", { name: "Português", exact: true }).click()

  await expect(page.getByRole("link", { name: "Pedidos de demonstração de Aline Moreira", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Caixa de correio Mailpit", exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({ path: test.info().outputPath("demo-mobile.png"), fullPage: true })
})

test("a failed reset leaves Rails stopped and can be rerun", async () => {
  test.setTimeout(180_000)
  run("docker", ["compose", "stop", "db"])
  try {
    expect(() => run("pnpm", ["demo:reset"])).toThrow()
    expect(run("docker", ["compose", "ps", "--status", "running", "--services"])).not.toMatch(/^backend$/m)
  } finally {
    run("docker", ["compose", "up", "-d", "--wait", "db"])
    run("pnpm", ["demo:reset"])
  }
})
