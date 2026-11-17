import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ScheduleAppointmentDialog } from "@/components/appointment/schedule-appointment-dialog"
import { nutritionist } from "@/test/nutritionist"
import { render } from "@/test/render"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))
vi.mock("next-intl/server", () => import("@/test/translations"))

afterEach(() => {
  vi.useRealTimers()
})

describe("ScheduleAppointmentDialog", () => {
  it("shows the request as sent, not confirmed, once the API takes it", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-20T12:00:00Z"), toFake: ["Date"] })
    const user = userEvent.setup()
    const fetch = stubApi(
      Response.json(
        {
          id: 17,
          status: "pending",
          guest_name: "Joana Silva",
          guest_email: "joana.silva@example.com",
          starts_at: "2026-11-23T10:00:00.000Z",
          ends_at: "2026-11-23T11:00:00.000Z",
          online: false,
          service: { id: 381, name: "Diabetes management", street_address: "Rua do Souto 45", city: "Braga" },
        },
        { status: 201 },
      ),
    )
    render(<ScheduleAppointmentDialog nutritionist={nutritionist} />)

    await user.click(screen.getByRole("button", { name: "Schedule appointment with Mary Jane" }))
    await user.type(screen.getByLabelText("Your name"), "Joana Silva")
    await user.type(screen.getByLabelText("Email"), "Joana.Silva@example.com")
    await user.click(screen.getByRole("button", { name: /Monday, 23 November 2026/ }))
    await user.click(screen.getByRole("button", { name: "10:00" }))
    await user.click(screen.getByRole("button", { name: "Request appointment" }))

    const dialog = await screen.findByRole("dialog", { name: "Appointment requested" })
    expect(dialog).toHaveTextContent(
      "You asked Mary Jane for Diabetes management on Monday 23 November at 10:00. This is not confirmed yet. " +
        "We will email joana.silva@example.com once Mary Jane answers your request.",
    )
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({
      appointment_request: {
        service_id: 381,
        guest_name: "Joana Silva",
        guest_email: "Joana.Silva@example.com",
        date: "2026-11-23",
        time: "10:00",
        online: false,
      },
    })
  })
})
