import { screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NutritionistCard } from "@/components/nutritionists/nutritionist-card"
import { nutritionist } from "@/test/nutritionist"
import { render } from "@/test/render"

vi.mock("@/app/actions", () => ({ requestAppointment: vi.fn() }))

afterEach(() => vi.unstubAllEnvs())

describe("nutritionist demo navigation", () => {
  it("links to the current nutritionist ID in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    render(<NutritionistCard nutritionist={{ ...nutritionist, id: 482 }} />)

    expect(screen.getByRole("link", { name: "Demo inbox for Mary Jane" })).toHaveAttribute("href", "/nutritionists/482/requests")
    expect(screen.getByRole("button", { name: "Schedule appointment" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Personal page" })).toBeVisible()
  })

  it("hides the demo link in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    render(<NutritionistCard nutritionist={nutritionist} />)

    expect(screen.queryByRole("link", { name: /Demo inbox/ })).not.toBeInTheDocument()
  })
})
