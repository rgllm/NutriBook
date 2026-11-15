import { format, parseISO } from "date-fns"

import type { CreatedAppointmentRequest } from "@/lib/api/appointment-requests"
import type { ValidationErrors } from "@/lib/api/http"
import { PRACTICE_TIME_ZONE } from "@/lib/format"

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

// The guest picks a calendar day and a slot in Portuguese wall-clock time, and
// the API reads them that way. So "today" and "now" must be Lisbon's too, not
// the browser's, or a guest abroad sees slots the API will refuse.
const practiceClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: PRACTICE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function practiceNow(now: Date) {
  const part = Object.fromEntries(practiceClock.formatToParts(now).map(({ type, value }) => [type, value]))
  return {
    day: `${part.year}-${part.month}-${part.day}`,
    minutes: Number(part.hour) * 60 + Number(part.minute),
  }
}

// The day the calendar shows, as the API expects it ("2026-11-23").
export const toBookingDay = (date: Date) => format(date, "yyyy-MM-dd")

// Today in Lisbon, as a calendar day in the browser's zone.
export const practiceToday = (now = new Date()) => parseISO(practiceNow(now).day)

export function isSlotInPast(date: Date | undefined, slot: TimeSlot, now = new Date()) {
  if (!date) return false
  const practice = practiceNow(now)
  const day = toBookingDay(date)
  if (day !== practice.day) return day < practice.day
  const [hours, minutes] = slot.split(":").map(Number)
  return hours * 60 + minutes <= practice.minutes
}
