"use server"

import { getTranslations } from "next-intl/server"

import { toMessageKey } from "@/i18n/message-key"
import { createAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiUnavailableError } from "@/lib/api/http"
import { searchNutritionistsNear, type Position, type SearchResults } from "@/lib/api/nutritionists"
import { toAppointmentErrors, type RequestAppointmentState } from "@/lib/appointment-request"
import type { SearchState } from "@/lib/search-params"

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

export type NearbySearchResult = { status: "found"; results: SearchResults } | { status: "unavailable" }

// A Server Action rather than a page, so the guest's position reaches Rails in
// a request body and never in a URL.
export async function searchNearby(search: SearchState, position: Position): Promise<NearbySearchResult> {
  try {
    return { status: "found", results: await searchNutritionistsNear(search, position) }
  } catch (error) {
    if (error instanceof ApiUnavailableError) return { status: "unavailable" }
    throw error
  }
}
