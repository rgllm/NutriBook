import { randomUUID } from "node:crypto"

import { expect, test as base, type APIRequestContext } from "@playwright/test"

import type { IsoDay, Slot } from "./schedule"
import { API_URL, E2E_CITY, MAILPIT_URL } from "./stack"

export type Guest = { name: string; email: string }

// A guest no other test or earlier attempt has used, so the one-pending-request
// rule never links two tests.
export function newGuest(firstName: string): Guest {
  const tag = randomUUID().slice(0, 8)
  return { name: `${firstName} ${tag}`, email: `${firstName.toLowerCase()}.${tag}@example.com` }
}

export type Nutritionist = { id: number; name: string; serviceIds: Map<string, number> }

export type Booking = { service: string; guest: Guest; day: IsoDay; time: Slot }

export class NutriBookApi {
  constructor(private readonly request: APIRequestContext) {}

  async nutritionist(name: string): Promise<Nutritionist> {
    const response = await this.request.get("/nutritionists", {
      params: { q: name, location: E2E_CITY },
    })
    expect(response).toBeOK()
    const { nutritionists } = (await response.json()) as {
      nutritionists: { id: number; name: string; services: { id: number; name: string }[] }[]
    }
    const found = nutritionists.find((nutritionist) => nutritionist.name === name)
    if (!found) throw new Error(`${name} is not in the e2e fixtures`)

    return {
      id: found.id,
      name: found.name,
      serviceIds: new Map(found.services.map((service) => [service.name, service.id])),
    }
  }

  async requestAppointment(nutritionist: Nutritionist, booking: Booking) {
    const serviceId = nutritionist.serviceIds.get(booking.service)
    if (!serviceId) throw new Error(`${nutritionist.name} does not offer ${booking.service}`)

    const response = await this.request.post("/appointment_requests", {
      data: {
        appointment_request: {
          service_id: serviceId,
          guest_name: booking.guest.name,
          guest_email: booking.guest.email,
          date: booking.day,
          time: booking.time,
          online: false,
        },
      },
    })
    expect(response.status(), await response.text()).toBe(201)
  }
}

export type Email = { subject: string; text: string }

export class Mailbox {
  constructor(private readonly request: APIRequestContext) {}

  // Waits for exactly `count` emails to the guest. Solid Queue sends them after
  // the answer commits, so they arrive a moment after the page updates.
  async emailsTo(guest: Guest, count: number): Promise<Email[]> {
    let ids: string[] = []
    await expect
      .poll(async () => {
        ids = await this.messageIds(guest)
        return ids.length
      })
      .toBe(count)

    return Promise.all(
      ids.map(async (id) => {
        const response = await this.request.get(`/api/v1/message/${id}`)
        expect(response).toBeOK()
        const { Subject, Text } = (await response.json()) as { Subject: string; Text: string }
        return { subject: Subject, text: Text }
      }),
    )
  }

  private async messageIds(guest: Guest) {
    const response = await this.request.get("/api/v1/search", {
      params: { query: `to:"${guest.email}"` },
    })
    expect(response).toBeOK()
    const { messages } = (await response.json()) as { messages: { ID: string }[] }
    return messages.map((message) => message.ID)
  }
}

export const test = base.extend<{ api: NutriBookApi; mailbox: Mailbox }>({
  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: API_URL })
    await use(new NutriBookApi(request))
    await request.dispose()
  },
  mailbox: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: MAILPIT_URL })
    await use(new Mailbox(request))
    await request.dispose()
  },
})

export { expect }
