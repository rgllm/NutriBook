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
// turns them into a UTC timestamp.
export type AppointmentRequestInput = {
  serviceId: string
  guestName: string
  guestEmail: string
  date: string
  time: string
  online: boolean
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
        })
        .transform(({ id, guest_name, guest_email, starts_at, ends_at, online, service }) => ({
          id,
          guestName: guest_name,
          guestEmail: guest_email,
          startsAt: new Date(starts_at),
          endsAt: new Date(ends_at),
          online,
          serviceName: service.name,
          // The API keeps requests whose time has passed until they are answered.
          overdue: new Date(starts_at) <= new Date(),
        })),
    ),
  })
  .transform(({ nutritionist, appointment_requests }) => ({
    nutritionist,
    requests: appointment_requests,
  }))

export type PendingRequests = z.infer<typeof pendingRequestsSchema>

export type PendingRequest = PendingRequests["requests"][number]

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
// as a validation error on status. A request that was already answered throws
// ApiConflictError; one that is not this nutritionist's throws ApiNotFoundError.
export function answerAppointmentRequest(nutritionistId: string, requestId: number, status: string) {
  return apiWrite(
    "PATCH",
    `/nutritionists/${encodeURIComponent(nutritionistId)}/appointment_requests/${requestId}`,
    { appointment_request: { status } },
    answeredRequestSchema,
  )
}
