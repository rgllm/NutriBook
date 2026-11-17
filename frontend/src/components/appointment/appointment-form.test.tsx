import { useActionState } from "react"
import { render as renderComponent, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppointmentForm } from "@/components/appointment/appointment-form"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { formats, PRACTICE_TIME_ZONE } from "@/i18n/formats"
import { MESSAGES } from "@/i18n/messages"
import type { RequestAppointmentState } from "@/lib/appointment-request"
import { nutritionist } from "@/test/nutritionist"
import { render } from "@/test/render"

type EditingState = Extract<RequestAppointmentState, { status: "editing" }>

const refused: EditingState = {
  status: "editing",
  errors: {
    name: "Enter your name.",
    email: "Enter a valid email, like name@example.com.",
    service: "Choose a service.",
    online: "Mary Jane does not offer online appointments.",
    when: "Pick one of the available times.",
    form: "Something else went wrong.",
  },
  values: { name: "", email: "joana@example" },
}

function renderForm(state: EditingState) {
  return render(
    <Dialog open>
      <DialogContent>
        <AppointmentForm nutritionist={nutritionist} state={state} action={vi.fn()} />
      </DialogContent>
    </Dialog>,
  )
}

// Submits through useActionState, as AppointmentFlow does, so React resets the
// form after each answer like it does in the app.
function FormWithAction({ answer }: { answer: (formData: FormData) => EditingState }) {
  const [state, action] = useActionState(
    async (_previous: EditingState, formData: FormData) => answer(formData),
    { status: "editing", errors: {}, values: { name: "", email: "" } },
  )
  return (
    <Dialog open>
      <DialogContent>
        <AppointmentForm nutritionist={nutritionist} state={state} action={action} />
      </DialogContent>
    </Dialog>
  )
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-20T12:00:00Z"), toFake: ["Date"] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("AppointmentForm", () => {
  it("shows each of the API's messages on its field", () => {
    renderForm(refused)

    expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription("Enter your name.")
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email, like name@example.com.")
    expect(screen.getByRole("combobox", { name: "Service" })).toHaveAccessibleDescription("Choose a service.")
    expect(screen.getByRole("checkbox", { name: "Online appointment" })).toHaveAccessibleDescription(
      "Mary Jane does not offer online appointments.",
    )
    expect(screen.getByRole("group", { name: "Time" })).toHaveAccessibleDescription(
      "Pick one of the available times.",
    )
    expect(screen.getByText("Something else went wrong.")).toHaveRole("alert")
  })

  it("marks the fields a request needs as required", () => {
    renderForm({ status: "editing", errors: {}, values: { name: "", email: "" } })

    expect(screen.getByLabelText("Your name")).toBeRequired()
    expect(screen.getByLabelText("Email")).toBeRequired()
    expect(screen.getByRole("combobox", { name: "Service" })).toBeRequired()
    expect(screen.getByRole("checkbox", { name: "Online appointment" })).not.toBeRequired()
  })

  it("moves focus to the first field the API refused", async () => {
    const user = userEvent.setup()
    render(
      <FormWithAction
        answer={(formData) => ({
          status: "editing",
          errors: { email: "Enter a valid email, like name@example.com.", when: "Pick a time." },
          values: { name: String(formData.get("name")), email: String(formData.get("email")) },
        })}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Request appointment" }))

    await screen.findByText("Enter a valid email, like name@example.com.")
    expect(screen.getByLabelText("Email")).toHaveFocus()
  })

  it("moves focus to the time slots when only the time was refused", async () => {
    const user = userEvent.setup()
    render(
      <FormWithAction
        answer={() => ({
          status: "editing",
          errors: { when: "Pick one of the available times." },
          values: { name: "Joana Silva", email: "joana@example.com" },
        })}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Request appointment" }))

    await screen.findByText("Pick one of the available times.")
    expect(screen.getByRole("group", { name: "Time" })).toHaveFocus()
  })

  it("clears a field's message once the guest changes that field", async () => {
    const user = userEvent.setup()
    renderForm(refused)

    await user.type(screen.getByLabelText("Your name"), "Joana Silva")
    await user.click(screen.getByRole("checkbox", { name: "Online appointment" }))
    await user.click(screen.getByRole("button", { name: /Monday, 23 November 2026/ }))

    expect(screen.getByLabelText("Your name")).not.toHaveAccessibleDescription()
    expect(screen.getByRole("checkbox", { name: "Online appointment" })).not.toHaveAccessibleDescription()
    expect(screen.getByRole("group", { name: "Monday 23 November" })).not.toHaveAccessibleDescription()
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email, like name@example.com.")
    expect(screen.queryByText("Enter your name.")).not.toBeInTheDocument()
  })

  it("keeps what the guest typed when the API refuses the request", async () => {
    const user = userEvent.setup()
    render(
      <FormWithAction
        answer={(formData) => ({
          status: "editing",
          errors: { email: "Enter a valid email, like name@example.com." },
          values: { name: String(formData.get("name")), email: String(formData.get("email")) },
        })}
      />,
    )

    await user.type(screen.getByLabelText("Your name"), "Joana Silva")
    await user.type(screen.getByLabelText("Email"), "joana@example")
    await user.click(screen.getByRole("button", { name: "Request appointment" }))

    await screen.findByText("Enter a valid email, like name@example.com.")
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email, like name@example.com.")
    expect(screen.getByLabelText("Your name")).toHaveValue("Joana Silva")
    expect(screen.getByLabelText("Email")).toHaveValue("joana@example")
  })

  it("sends the language the form is shown in, for the answer email", async () => {
    const user = userEvent.setup()
    const answer = vi.fn<(formData: FormData) => EditingState>(() => ({
      status: "editing",
      errors: {},
      values: { name: "", email: "" },
    }))
    renderComponent(<FormWithAction answer={answer} />, {
      wrapper: ({ children }) => (
        <NextIntlClientProvider locale="pt-PT" messages={MESSAGES["pt-PT"]} formats={formats} timeZone={PRACTICE_TIME_ZONE}>
          {children}
        </NextIntlClientProvider>
      ),
    })

    await user.click(screen.getByRole("button", { name: "Pedir consulta" }))

    await vi.waitFor(() => expect(answer).toHaveBeenCalled())
    expect(answer.mock.calls[0][0].get("language")).toBe("pt-PT")
  })
})
