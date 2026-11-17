import type { Formats } from "next-intl"

export const PRACTICE_TIME_ZONE = "Europe/Lisbon"

export const formats = {
  dateTime: {
    requestDay: { weekday: "short", day: "numeric", month: "long", year: "numeric" },
    appointmentDay: { weekday: "long", day: "numeric", month: "long" },
    time: { hour: "2-digit", minute: "2-digit" },
  },
  number: {
    price: { style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" },
    distance: { style: "unit", unit: "kilometer", maximumFractionDigits: 1 },
  },
} satisfies Formats
