"use server"

import { createAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiUnavailableError } from "@/lib/api/http"
import { toAppointmentErrors, type RequestAppointmentState } from "@/lib/appointment-request"

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "")

export async function requestAppointment(
  _previous: RequestAppointmentState,
  formData: FormData,
): Promise<RequestAppointmentState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") }

  try {
    const result = await createAppointmentRequest({
      serviceId: text(formData, "service_id"),
      guestName: values.name,
      guestEmail: values.email,
      date: text(formData, "date"),
      time: text(formData, "time"),
      online: formData.get("online") === "true",
    })
    return result.ok
      ? { status: "sent", request: result.data }
      : { status: "editing", errors: toAppointmentErrors(result.errors), values }
  } catch (error) {
    if (!(error instanceof ApiUnavailableError)) throw error
    return {
      status: "editing",
      errors: { form: "We could not send your request. Try again in a moment." },
      values,
    }
  }
}
