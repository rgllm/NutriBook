"use server"

import { getTranslations } from "next-intl/server"

import { createAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiNotFoundError, ApiUnavailableError } from "@/lib/api/http"
import { fetchNearestCity } from "@/lib/api/locations"
import { toAppointmentErrors, type RequestAppointmentState } from "@/lib/appointment-request"

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "")

export async function requestAppointment(
  _previous: RequestAppointmentState,
  formData: FormData,
): Promise<RequestAppointmentState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") }
  const serviceId = text(formData, "service_id")
  const [t, tErrors] = await Promise.all([
    getTranslations("Appointment"),
    getTranslations("AppointmentErrors"),
  ])
  const describe = (key: string, code: string) => {
    const id = `${key}.${code}` as Parameters<typeof tErrors>[0]
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
    })
    return result.ok
      ? { status: "sent", request: result.data }
      : { status: "editing", errors: toAppointmentErrors(result.errors, describe), values }
  } catch (error) {
    if (!(error instanceof ApiUnavailableError)) throw error
    return {
      status: "editing",
      errors: { form: t("unavailable") },
      values,
    }
  }
}

export type NearestCityResult = { status: "found"; city: string } | { status: "unavailable" }

export async function findNearestCity(latitude: number, longitude: number): Promise<NearestCityResult> {
  try {
    return { status: "found", city: await fetchNearestCity(latitude, longitude) }
  } catch (error) {
    if (error instanceof ApiUnavailableError || error instanceof ApiNotFoundError) return { status: "unavailable" }
    throw error
  }
}
