import type { Formats } from "next-intl"

// Requests are stored in UTC and shown in the practice's time zone, so the
// server render and the browser agree whatever zone either runs in.
export const PRACTICE_TIME_ZONE = "Europe/Lisbon"

export const formats = {
  dateTime: {
    requestDay: { weekday: "short", day: "numeric", month: "long", year: "numeric" },
    appointmentDay: { weekday: "long", day: "numeric", month: "long" },
    time: { hour: "2-digit", minute: "2-digit" },
  },
  number: {
    price: { style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" },
  },
} satisfies Formats
