import { describe, expect, it } from "vitest"

import { toAppointmentErrors } from "@/lib/appointment-request"

describe("toAppointmentErrors", () => {
  it("puts each API message under the form field it belongs to", () => {
    expect(
      toAppointmentErrors({
        guest_name: ["Enter your name."],
        guest_email: ["Enter a valid email, like name@example.com."],
        service: ["Choose a service."],
        starts_at: ["Pick one of the available times."],
        online: ["This nutritionist does not offer online appointments."],
      }),
    ).toEqual({
      name: "Enter your name.",
      email: "Enter a valid email, like name@example.com.",
      service: "Choose a service.",
      when: "Pick one of the available times.",
      online: "This nutritionist does not offer online appointments.",
    })
  })

  it("shows the first message of a field", () => {
    expect(toAppointmentErrors({ guest_email: ["First.", "Second."] })).toEqual({ email: "First." })
  })

  it("keeps a message for a field the form does not have", () => {
    expect(toAppointmentErrors({ nutritionist: ["must exist"] })).toEqual({ form: "must exist" })
  })

  it("has nothing to show when there are no errors", () => {
    expect(toAppointmentErrors({})).toEqual({})
  })
})
