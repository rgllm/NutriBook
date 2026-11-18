import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { answerRequest } from "@/app/professionals/[id]/requests/actions"
import { AnswerRequestForm } from "@/components/requests/answer-request-form"
import type { AnswerRequestState } from "@/lib/pending-requests"
import { render } from "@/test/render"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))
vi.mock("next-intl/server", () => import("@/test/translations"))
vi.mock("next/cache", () => ({ refresh: vi.fn() }))

const accept = () => screen.getByRole("button", { name: "Accept the request from Rita Gomes" })
const reject = () => screen.getByRole("button", { name: "Reject the request from Rita Gomes" })

describe("AnswerRequestForm", () => {
  it("disables both answers while one is sent and says which one", async () => {
    const user = userEvent.setup()
    const { promise, resolve } = Promise.withResolvers<AnswerRequestState>()
    render(<AnswerRequestForm action={() => promise} guestName="Rita Gomes" />)

    await user.click(accept())

    expect(accept()).toBeDisabled()
    expect(accept()).toHaveTextContent("Accepting…")
    expect(reject()).toBeDisabled()
    expect(reject()).toHaveTextContent("Reject")

    resolve({ status: "failed", error: "We could not answer this request." })

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not answer this request.")
    expect(accept()).toBeEnabled()
    expect(accept()).toHaveTextContent("Accept")
  })

  it("keeps the request and asks to try again when the API is down", async () => {
    const user = userEvent.setup()
    stubApi(new TypeError("fetch failed"))
    render(<AnswerRequestForm action={answerRequest.bind(null, "1", 7)} guestName="Rita Gomes" />)

    await user.click(reject())

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not answer this request. Try again in a moment.",
    )
    expect(accept()).toBeEnabled()
    expect(reject()).toBeEnabled()
  })
})
