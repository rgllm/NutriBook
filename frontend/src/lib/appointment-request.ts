import { format, parseISO } from "date-fns"

import type { CreatedAppointmentRequest } from "@/lib/api/appointment-requests"
import type { ValidationErrors } from "@/lib/api/http"
import { PRACTICE_TIME_ZONE } from "@/i18n/formats"

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
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

// Shows the first of each field's error codes as the message that describe()
// gives it, in the guest's language.
export function toAppointmentErrors(
  errors: ValidationErrors,
  describe: (key: string, code: string) => string,
): AppointmentErrors {
  const formErrors: AppointmentErrors = {}
  for (const [key, codes] of Object.entries(errors)) {
    const field = FIELDS_BY_API_KEY[key] ?? "form"
    formErrors[field] ??= describe(key, codes[0])
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

// What a Lisbon wall clock shows at `instant`.
function practiceClockAt(instant: Date) {
  const part = Object.fromEntries(practiceClock.formatToParts(instant).map(({ type, value }) => [type, value]))
  return {
    day: `${part.year}-${part.month}-${part.day}`,
    time: `${part.hour}:${part.minute}`,
    minutes: Number(part.hour) * 60 + Number(part.minute),
  }
}

// The day the calendar shows, as the API expects it ("2026-11-23").
export const toBookingDay = (date: Date) => format(date, "yyyy-MM-dd")

// Noon UTC on the calendar's day falls on that same day in Lisbon, so the
// formatter, which shows Lisbon time, names the day the guest picked.
export const bookingDayInstant = (date: Date) => new Date(`${toBookingDay(date)}T12:00:00Z`)

// Today in Lisbon, as a calendar day in the browser's zone.
export const practiceToday = (now = new Date()) => parseISO(practiceClockAt(now).day)

export function isSlotInPast(date: Date | undefined, slot: TimeSlot, now = new Date()) {
  if (!date) return false
  const practice = practiceClockAt(now)
  const day = toBookingDay(date)
  if (day !== practice.day) return day < practice.day
  const [hours, minutes] = slot.split(":").map(Number)
  return hours * 60 + minutes <= practice.minutes
}

// A slot the API sends as an instant, as the day and time the guest picks in
// Lisbon: "2026-12-01 14:00".
export function toPracticeSlot(instant: string) {
  const { day, time } = practiceClockAt(new Date(instant))
  return `${day} ${time}`
}

export const isSlotTaken = (takenSlots: readonly string[], date: Date, slot: TimeSlot) =>
  takenSlots.includes(`${toBookingDay(date)} ${slot}`)
