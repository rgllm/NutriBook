"use client"

import { useActionState } from "react"

import { requestAppointment } from "@/app/actions"
import { AppointmentForm } from "@/components/appointment/appointment-form"
import { AppointmentRequestSent } from "@/components/appointment/appointment-request-sent"
import type { RequestAppointmentState } from "@/lib/appointment-request"
import type { Nutritionist } from "@/lib/api/nutritionists"

const initialState: RequestAppointmentState = {
  status: "editing",
  errors: {},
  values: { name: "", email: "" },
}

export function AppointmentFlow({ nutritionist }: { nutritionist: Nutritionist }) {
  const [state, formAction] = useActionState(requestAppointment, initialState)

  return state.status === "sent" ? (
    <AppointmentRequestSent nutritionist={nutritionist} request={state.request} />
  ) : (
    <AppointmentForm nutritionist={nutritionist} state={state} action={formAction} />
  )
}
