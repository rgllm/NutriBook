import { z } from "zod"

import { ApiNotFoundError, apiGet, apiWrite } from "@/lib/api/http"
import { REQUEST_ANSWERS } from "@/lib/pending-requests"

const appointmentRequestSchema = z
  .object({
    id: z.number(),
    guest_email: z.string(),
    starts_at: z.iso.datetime(),
    ends_at: z.iso.datetime(),
    online: z.boolean(),
    service: z.object({ name: z.string() }),
  })
  .transform(({ id, guest_email, starts_at, ends_at, online, service }) => ({
    id,
    guestEmail: guest_email,
    startsAt: new Date(starts_at),
    endsAt: new Date(ends_at),
    online,
    serviceName: service.name,
  }))

export type CreatedAppointmentRequest = z.infer<typeof appointmentRequestSchema>

// The day and time are the guest's picks in Portuguese time, as typed; the API
// turns them into a UTC timestamp. With no service, the API asks for one. The
// language is the one the guest booked in; the API writes the answer email in
// it, or in English when it does not write that language.
export type AppointmentRequestInput = {
  serviceId?: number
  guestName: string
  guestEmail: string
  date: string
  time: string
  online: boolean
  language: string
}

export function createAppointmentRequest(input: AppointmentRequestInput) {
  return apiWrite(
    "POST",
    "/appointment_requests",
    {
      appointment_request: {
        service_id: input.serviceId,
        guest_name: input.guestName,
        guest_email: input.guestEmail,
        date: input.date,
        time: input.time,
        online: input.online,
        language: input.language,
      },
    },
    appointmentRequestSchema,
  )
}

const pendingRequestsSchema = z
  .object({
    nutritionist: z.object({ id: z.number(), name: z.string() }),
    appointment_requests: z.array(
      z
        .object({
          id: z.number(),
          guest_name: z.string(),
          guest_email: z.string(),
          starts_at: z.iso.datetime(),
          ends_at: z.iso.datetime(),
          online: z.boolean(),
          service: z.object({ name: z.string() }),
          overlapping_ids: z.array(z.number()),
        })
        .transform(({ id, guest_name, guest_email, starts_at, ends_at, online, service, overlapping_ids }) => ({
          request: {
            id,
            guestName: guest_name,
            guestEmail: guest_email,
            startsAt: new Date(starts_at),
            endsAt: new Date(ends_at),
            online,
            serviceName: service.name,
            // The API keeps requests whose time has passed until they are answered.
            overdue: new Date(starts_at) <= new Date(),
          },
          overlappingIds: overlapping_ids,
        })),
    ),
  })
  .transform(({ nutritionist, appointment_requests }) => {
    const byId = new Map(appointment_requests.map(({ request }) => [request.id, request]))
    return {
      nutritionist,
      // The API decides what overlaps, from requests in this same list; the
      // ids only become the guests and times the nutritionist reads.
      requests: appointment_requests.map(({ request, overlappingIds }) => ({
        ...request,
        overlaps: overlappingIds.flatMap((id) => byId.get(id) ?? []),
      })),
    }
  })

export type PendingRequests = z.infer<typeof pendingRequestsSchema>

export type PendingRequest = PendingRequests["requests"][number]

export type RequestOverlap = PendingRequest["overlaps"][number]

// Resolves to null when no nutritionist has this id.
export async function getPendingRequests(nutritionistId: string) {
  try {
    return await apiGet(
      `/nutritionists/${encodeURIComponent(nutritionistId)}/appointment_requests`,
      pendingRequestsSchema,
    )
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null
    throw error
  }
}

const answeredRequestSchema = z
  .object({ id: z.number(), status: z.enum(REQUEST_ANSWERS), rejected_ids: z.array(z.number()) })
  .transform(({ id, status, rejected_ids }) => ({ id, status, rejectedIds: rejected_ids }))

// The status is the API's: "accepted" or "rejected". Anything else comes back
// as a validation error on status. The overlapping ids are the ones the
// nutritionist was shown; accepting refuses to reject any other. A request that
// was already answered, or whose overlaps changed, throws ApiConflictError; one
// that is not this nutritionist's throws ApiNotFoundError.
export function answerAppointmentRequest(
  nutritionistId: string,
  requestId: number,
  status: string,
  overlappingIds: number[],
) {
  return apiWrite(
    "PATCH",
    `/nutritionists/${encodeURIComponent(nutritionistId)}/appointment_requests/${requestId}`,
    { appointment_request: { status, overlapping_ids: overlappingIds } },
    answeredRequestSchema,
  )
}
