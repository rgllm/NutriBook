import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { BACKEND_PORT, COMPOSE_PROJECT_NAME, MAILPIT_PORT, MAILPIT_URL } from "./support/stack"

const root = fileURLToPath(new URL("..", import.meta.url))
const fixture = readFileSync(new URL("fixtures/nutritionists.rb", import.meta.url))

function compose(args: string[], input?: Buffer) {
  execFileSync(
    "docker",
    ["compose", "-p", COMPOSE_PROJECT_NAME, "-f", "compose.yaml", "-f", "e2e/compose.yaml", ...args],
    {
      cwd: root,
      env: { ...process.env, BACKEND_PORT: String(BACKEND_PORT), MAILPIT_PORT: String(MAILPIT_PORT) },
      input,
      stdio: [input ? "pipe" : "ignore", "inherit", "inherit"],
    },
  )
}

// Resets the nutribook-e2e stack to the demo seeds plus the e2e fixture, with
// an empty inbox. Replanting truncates Solid Queue's tables, which the worker
// inside Puma polls, so Rails stays stopped until the data is in place.
export default async function globalSetup() {
  compose(["build", "backend"])
  compose(["stop", "backend"])
  compose(["up", "--detach", "--wait", "db", "mailpit"])
  compose(["run", "--rm", "--no-deps", "backend", "bin/rails", "db:prepare", "db:seed:replant"])
  compose(["run", "--rm", "--no-deps", "-T", "backend", "bin/rails", "runner", "-"], fixture)

  const cleared = await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" })
  if (!cleared.ok) throw new Error(`Emptying Mailpit returned ${cleared.status}`)

  compose(["up", "--detach", "--wait", "backend"])
}
