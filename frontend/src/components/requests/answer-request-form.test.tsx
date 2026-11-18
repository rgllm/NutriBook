import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { answerRequest } from "@/app/nutritionists/[id]/requests/actions"
import { AnswerRequestForm } from "@/components/requests/answer-request-form"
import type { AnswerRequestState } from "@/lib/pending-requests"
import { render } from "@/test/render"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))
vi.mock("next-intl/server", () => import("@/test/translations"))
vi.mock("next/cache", () => ({ refresh: vi.fn() }))

const accept = () => screen.getByRole("button", { name: "Accept the request from Rita Gomes" })
const reject = () => screen.getByRole("button", { name: "Reject the request from Rita Gomes" })

const bruno = {
  id: 8,
  guestName: "Bruno Costa",
  guestEmail: "bruno.costa@example.com",
  startsAt: new Date("2026-12-01T10:00:00Z"),
  endsAt: new Date("2026-12-01T10:30:00Z"),
  online: false,
  serviceName: "Follow-up",
  overdue: false,
}

describe("AnswerRequestForm", () => {
  it("disables both answers while one is sent and says which one", async () => {
    const user = userEvent.setup()
    const { promise, resolve } = Promise.withResolvers<AnswerRequestState>()
    render(<AnswerRequestForm action={() => promise} guestName="Rita Gomes" overlaps={[]} />)

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
    render(<AnswerRequestForm action={answerRequest.bind(null, "1", 7, [])} guestName="Rita Gomes" overlaps={[]} />)

    await user.click(reject())

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not answer this request. Try again in a moment.",
    )
    expect(accept()).toBeEnabled()
    expect(reject()).toBeEnabled()
  })

  it("lists the overlapping requests before accepting, and Cancel leaves the request pending", async () => {
    const user = userEvent.setup()
    const action = vi.fn<(previous: AnswerRequestState, formData: FormData) => Promise<AnswerRequestState>>(
      async () => ({ status: "failed", error: "We could not answer this request." }),
    )
    render(<AnswerRequestForm action={action} guestName="Rita Gomes" overlaps={[bruno]} />)

    await user.click(accept())

    const dialog = await screen.findByRole("dialog", { name: "Accept Rita Gomes's request?" })
    expect(dialog).toHaveTextContent(
      "It overlaps this pending request, which will be rejected. Its guest gets an email.",
    )
    expect(within(dialog).getByRole("listitem")).toHaveTextContent("Bruno Costa")
    expect(within(dialog).getByRole("listitem")).toHaveTextContent("Follow-up, 10:00–10:30")
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(action).not.toHaveBeenCalled()
  })

  it("accepts from the confirmation and shows a failure under the card", async () => {
    const user = userEvent.setup()
    const action = vi.fn<(previous: AnswerRequestState, formData: FormData) => Promise<AnswerRequestState>>(
      async () => ({ status: "failed", error: "We could not answer this request." }),
    )
    render(<AnswerRequestForm action={action} guestName="Rita Gomes" overlaps={[bruno]} />)

    await user.click(accept())
    await user.click(await screen.findByRole("button", { name: "Accept and reject 1" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not answer this request.")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(action).toHaveBeenCalledOnce()
    expect(action.mock.calls[0][1].get("status")).toBe("accepted")
  })
})
