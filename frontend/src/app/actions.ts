"use server"

import { refresh } from "next/cache"
import { getTranslations } from "next-intl/server"

import { toMessageKey } from "@/i18n/message-key"
import { createAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiUnavailableError } from "@/lib/api/http"
import { toAppointmentErrors, type RequestAppointmentState } from "@/lib/appointment-request"

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "")

export async function requestAppointment(
  _previous: RequestAppointmentState,
  formData: FormData,
): Promise<RequestAppointmentState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") }
  const serviceId = text(formData, "service_id")
  const [t, tErrors] = await Promise.all([
    getTranslations("appointment"),
    getTranslations("appointmentErrors"),
  ])
  const describe = (key: string, code: string) => {
    const id = `${toMessageKey(key)}.${toMessageKey(code)}` as Parameters<typeof tErrors>[0]
    return tErrors.has(id) ? tErrors(id) : tErrors("unknown")
  }

  try {
    const result = await createAppointmentRequest({
      serviceId: serviceId ? Number(serviceId) : undefined,
      guestName: values.name,
      guestEmail: values.email,
      date: text(formData, "date"),
      time: text(formData, "time"),
      online: formData.get("online") === "true",
      language: text(formData, "language"),
    })
    if (result.ok) return { status: "sent", request: result.data }
    // The page was loaded before the time was taken: refreshing it brings the
    // service's taken slots up to date, so the form drops the time it refused.
    if (result.errors.starts_at?.includes("taken")) refresh()
    return { status: "editing", errors: toAppointmentErrors(result.errors, describe), values }
  } catch (error) {
    if (!(error instanceof ApiUnavailableError)) throw error
    return {
      status: "editing",
      errors: { form: t("unavailable") },
      values,
    }
  }
}
