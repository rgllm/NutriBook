import { screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DemoFooter } from "@/components/demo-footer"
import { render } from "@/test/render"

afterEach(() => vi.unstubAllEnvs())

describe("DemoFooter", () => {
  it("links to the local mailbox in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("MAILPIT_URL", undefined)
    render(<DemoFooter />)

    expect(screen.getByRole("contentinfo")).toHaveTextContent("Synthetic demo data.")
    expect(screen.getByRole("link", { name: "Mailpit inbox" })).toHaveAttribute("href", "http://localhost:8025")
  })

  it("uses the configured browser-facing mailbox URL", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("MAILPIT_URL", "http://127.0.0.1:8125")
    render(<DemoFooter />)

    expect(screen.getByRole("link", { name: "Mailpit inbox" })).toHaveAttribute("href", "http://127.0.0.1:8125")
  })

  it("renders nothing in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    render(<DemoFooter />)

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument()
  })
})
