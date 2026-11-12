"use client"

import { useState } from "react"

import { AppointmentForm } from "@/components/appointment/appointment-form"
import { AppointmentRequestSent } from "@/components/appointment/appointment-request-sent"
import type { AppointmentRequest } from "@/lib/appointment-request"
import type { Nutritionist } from "@/lib/nutritionists"

export function AppointmentFlow({ nutritionist }: { nutritionist: Nutritionist }) {
  const [request, setRequest] = useState<AppointmentRequest | null>(null)
  return request ? (
    <AppointmentRequestSent nutritionist={nutritionist} request={request} />
  ) : (
    <AppointmentForm nutritionist={nutritionist} onSubmit={setRequest} />
  )
}
