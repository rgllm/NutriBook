import { isToday } from "date-fns"

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

export type AppointmentRequest = {
  name: string
  email: string
  date: Date
  time: TimeSlot
}

export type AppointmentDraft = Partial<AppointmentRequest>
export type AppointmentErrors = Partial<Record<keyof AppointmentRequest, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAppointment(draft: AppointmentDraft): AppointmentErrors {
  const errors: AppointmentErrors = {}
  if (!draft.name?.trim()) errors.name = "Enter your name."
  if (!draft.email?.trim()) errors.email = "Enter your email."
  else if (!EMAIL_PATTERN.test(draft.email.trim()))
    errors.email = "Enter a valid email, like name@example.com."
  if (!draft.date) errors.date = "Pick a day."
  if (!draft.time) errors.time = "Pick a time."
  return errors
}

export function isSlotInPast(date: Date | undefined, slot: TimeSlot) {
  if (!date || !isToday(date)) return false
  const [hours, minutes] = slot.split(":").map(Number)
  const now = new Date()
  return hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes()
}
