import { describe, expect, it } from "vitest"

import { validateAppointment } from "@/lib/appointment-request"

const complete = {
  name: "Rita Gomes",
  email: "rita.gomes@example.com",
  serviceId: 34,
  online: false,
  date: new Date(2026, 11, 21),
  time: "10:00",
} as const

describe("validateAppointment", () => {
  it("accepts a complete request, in person or online", () => {
    expect(validateAppointment(complete)).toEqual({})
    expect(validateAppointment({ ...complete, online: true })).toEqual({})
  })

  it("asks for a service", () => {
    expect(validateAppointment({ ...complete, serviceId: undefined })).toEqual({
      serviceId: "Choose a service.",
    })
  })

  it("reports every missing field at once", () => {
    expect(validateAppointment({})).toEqual({
      name: "Enter your name.",
      email: "Enter your email.",
      serviceId: "Choose a service.",
      date: "Pick a day.",
      time: "Pick a time.",
    })
  })

  it("rejects a malformed email", () => {
    expect(validateAppointment({ ...complete, email: "rita@" })).toEqual({
      email: "Enter a valid email, like name@example.com.",
    })
  })
})
