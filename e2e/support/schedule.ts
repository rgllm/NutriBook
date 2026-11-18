// Appointment days and times are wall-clock values in Lisbon, the zone guests
// book in, whatever zone the test machine or the browser runs in.
const PRACTICE_TIME_ZONE = "Europe/Lisbon"

export type IsoDay = `${number}-${number}-${number}`
export type Slot = `${number}:${"00" | "30"}`

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: PRACTICE_TIME_ZONE })
const utcOffset = new Intl.DateTimeFormat("en-US", {
  timeZone: PRACTICE_TIME_ZONE,
  timeZoneName: "longOffset",
})

const midnightUtc = (day: IsoDay) => new Date(`${day}T00:00:00Z`)

export function addDays(day: IsoDay, days: number): IsoDay {
  const date = midnightUtc(day)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10) as IsoDay
}

// A Monday at least two days away in Lisbon, so every slot that week is still
// bookable whenever the suite runs. A later week keeps a retried test off the
// slots its failed attempt already took.
export function upcomingMonday(weeksAhead = 0): IsoDay {
  const earliest = addDays(isoDay.format(new Date()) as IsoDay, 2)
  const daysToMonday = (8 - midnightUtc(earliest).getUTCDay()) % 7
  return addDays(earliest, daysToMonday + 7 * weeksAhead)
}

// The instant a Lisbon wall clock shows `slot` on `day`.
export function lisbonInstant(day: IsoDay, slot: string): Date {
  const [hours, minutes] = slot.split(":").map(Number)
  const wallClock = midnightUtc(day).getTime() + (hours * 60 + minutes) * 60_000
  const offset = utcOffset
    .formatToParts(new Date(wallClock))
    .find((part) => part.type === "timeZoneName")?.value
  const [, sign, offsetHours, offsetMinutes] = /GMT([+-])(\d{2}):(\d{2})/.exec(offset ?? "") ?? []
  const offsetMs = sign
    ? (sign === "+" ? 1 : -1) * (Number(offsetHours) * 60 + Number(offsetMinutes)) * 60_000
    : 0
  return new Date(wallClock - offsetMs)
}
