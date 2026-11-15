import { z } from "zod"

import { apiPost } from "@/lib/api/http"

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
  return apiPost(
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
