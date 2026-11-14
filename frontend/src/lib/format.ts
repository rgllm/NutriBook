// Portuguese convention puts the symbol after the amount ("39€"), which no
// locale's currency style produces with English digits, so append it.
const euros = new Intl.NumberFormat("en-IE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: "stripIfInteger",
})

export const formatEuros = (amount: number) => `${euros.format(amount)}€`

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")

// Requests are stored in UTC and shown in the practice's time zone, so the
// server render and the browser agree whatever zone either runs in.
const PRACTICE_TIME_ZONE = "Europe/Lisbon"

const requestDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: PRACTICE_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
})

const requestTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: PRACTICE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
})

export const formatRequestDate = (startsAt: Date) => requestDate.format(startsAt)

export const formatRequestTimeRange = (startsAt: Date, durationMinutes: number) =>
  requestTime.formatRange(startsAt, new Date(startsAt.getTime() + durationMinutes * 60_000))
