import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { toast } from "sonner"
import { NextIntlClientProvider } from "next-intl"
import { MESSAGES } from "@/i18n/messages"

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

afterEach(() => vi.restoreAllMocks())

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

  it("shows the affected guests and allows cancellation and Escape without submitting", async () => {
    const user = userEvent.setup()
    const action = vi.fn()
    render(<AnswerRequestForm action={action} guestName="Rita Gomes" overlappingGuests={["Ana Silva", "João Costa"]} />)

    await user.click(accept())
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveTextContent("Accepting will reject the overlapping requests from Ana Silva and João Costa.")
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(action).not.toHaveBeenCalled()
    await user.click(accept())
    await user.keyboard("{Escape}")
    expect(action).not.toHaveBeenCalled()
    expect(accept()).toHaveFocus()
  })

  it("submits acceptance only after confirmation and keeps failures in the dialog for retry", async () => {
    const user = userEvent.setup()
    const { promise, resolve } = Promise.withResolvers<AnswerRequestState>()
    const action = vi.fn<(previous: AnswerRequestState, data: FormData) => Promise<AnswerRequestState>>(() => promise)
    render(<AnswerRequestForm action={action} guestName="Rita Gomes" overlappingGuests={["Ana Silva"]} />)

    await user.click(accept())
    expect(action).not.toHaveBeenCalled()
    const dialog = within(screen.getByRole("dialog"))
    await user.click(dialog.getByRole("button", { name: "Accept the request from Rita Gomes" }))
    expect(action).toHaveBeenCalledOnce()
    expect(action.mock.calls[0]?.[1].get("status")).toBe("accepted")
    expect(dialog.getByRole("button", { name: "Accept the request from Rita Gomes" })).toBeDisabled()
    expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled()
    resolve({ status: "failed", error: "Try again." })
    expect(await dialog.findByRole("alert")).toHaveTextContent("Try again.")
    expect(dialog.getByRole("button", { name: "Accept the request from Rita Gomes" })).toBeEnabled()
  })

  it("still rejects an overlapping request without confirmation", async () => {
    const user = userEvent.setup()
    const action = vi.fn(async (): Promise<AnswerRequestState> => ({ status: "failed", error: "Try again." }))
    render(<AnswerRequestForm action={action} guestName="Rita Gomes" overlappingGuests={["Ana Silva"]} />)
    await user.click(reject())
    expect(action).toHaveBeenCalledOnce()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it.each([0, 1])("reports the API rejection count of %s even when the preview had two guests", async (rejectedCount) => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, "success").mockReturnValue("toast")
    const action = async (): Promise<AnswerRequestState> => ({ status: "answered", answer: "accepted", rejectedCount })
    render(<AnswerRequestForm action={action} guestName="Rita Gomes" overlappingGuests={["Ana", "João"]} />)
    await user.click(accept())
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Accept the request from Rita Gomes" }))
    expect(success).toHaveBeenCalledWith(
      rejectedCount === 0 ? "Accepted Rita Gomes's request." : "Accepted Rita Gomes's request. 1 overlapping request was rejected.",
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("translates the confirmation and guest list into Portuguese", async () => {
    const user = userEvent.setup()
    render(
      <NextIntlClientProvider locale="pt-PT" messages={MESSAGES["pt-PT"]}>
        <AnswerRequestForm action={vi.fn()} guestName="Rita Gomes" overlappingGuests={["Ana", "João"]} />
      </NextIntlClientProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Aceitar o pedido de Rita Gomes" }))
    expect(screen.getByRole("dialog")).toHaveTextContent("Ao aceitar, os pedidos sobrepostos de Ana e João serão rejeitados.")
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeVisible()
  })
})
