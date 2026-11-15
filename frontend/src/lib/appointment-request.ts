import { isToday } from "date-fns"

import type { CreatedAppointmentRequest } from "@/lib/api/appointment-requests"
import type { ValidationErrors } from "@/lib/api/http"

// Mirrors BookingSchedule::SLOT_HOURS in the backend, which enforces them.
export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const

export type TimeSlot = (typeof TIME_SLOTS)[number]

export type AppointmentField = "name" | "email" | "service" | "when" | "online"

// One message per field, plus "form" for a problem that belongs to no field.
export type AppointmentErrors = Partial<Record<AppointmentField | "form", string>>

export type RequestAppointmentState =
  | { status: "editing"; errors: AppointmentErrors; values: { name: string; email: string } }
  | { status: "sent"; request: CreatedAppointmentRequest }

const FIELDS_BY_API_KEY: Record<string, AppointmentField> = {
  guest_name: "name",
  guest_email: "email",
  service: "service",
  starts_at: "when",
  online: "online",
}

export function toAppointmentErrors(errors: ValidationErrors): AppointmentErrors {
  const formErrors: AppointmentErrors = {}
  for (const [key, messages] of Object.entries(errors)) {
    const field = FIELDS_BY_API_KEY[key] ?? "form"
    formErrors[field] ??= messages[0]
  }
  return formErrors
}

export function isSlotInPast(date: Date | undefined, slot: TimeSlot) {
  if (!date || !isToday(date)) return false
  const [hours, minutes] = slot.split(":").map(Number)
  const now = new Date()
  return hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes()
}
