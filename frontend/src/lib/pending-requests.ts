// Mock store for the nutritionist's pending requests until the Rails API
// serves them. It lives in server memory, so answers last until the dev
// server restarts. The overlap auto-rejection and the guest emails are
// backend rules and are not simulated here.

export type PendingRequest = {
  id: string
  guestName: string
  guestEmail: string
  serviceName: string
  // ISO 8601 in UTC, as the API will send it.
  startsAt: string
  durationMinutes: number
}

export const REQUEST_DECISIONS = ["accept", "reject"] as const

export type RequestDecision = (typeof REQUEST_DECISIONS)[number]

export type AnswerRequestState = { error: string | null }

const pendingRequests: PendingRequest[] = [
  {
    id: "1",
    guestName: "Francisco Neves",
    guestEmail: "francisco.neves@example.com",
    serviceName: "Online appointment",
    startsAt: "2026-12-21T09:30:00Z",
    durationMinutes: 60,
  },
  {
    id: "2",
    guestName: "Rita Gomes",
    guestEmail: "rita.gomes@example.com",
    serviceName: "First appointment",
    startsAt: "2026-11-18T10:00:00Z",
    durationMinutes: 60,
  },
  {
    id: "3",
    guestName: "Miguel Oliveira",
    guestEmail: "miguel.oliveira@example.com",
    serviceName: "Follow-up",
    startsAt: "2026-11-18T10:30:00Z",
    durationMinutes: 30,
  },
  {
    id: "4",
    guestName: "Joana Silva",
    guestEmail: "joana.silva@example.com",
    serviceName: "Weight loss",
    startsAt: "2026-11-20T15:00:00Z",
    durationMinutes: 45,
  },
  {
    id: "5",
    guestName: "André Fernandes",
    guestEmail: "andre.fernandes@example.com",
    serviceName: "Sports nutrition",
    startsAt: "2026-11-25T17:00:00Z",
    durationMinutes: 60,
  },
]

// Every nutritionist sees the same list; the API will scope it by nutritionist.
export function listPendingRequests(): PendingRequest[] {
  return pendingRequests.toSorted((a, b) => a.startsAt.localeCompare(b.startsAt))
}

// Answering takes the request off the pending list, whatever the decision.
export function removePendingRequest(requestId: string): boolean {
  const index = pendingRequests.findIndex((request) => request.id === requestId)
  if (index === -1) return false
  pendingRequests.splice(index, 1)
  return true
}
