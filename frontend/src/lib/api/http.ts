import "server-only"

import { z } from "zod"

const API_URL = z
  .url({ error: "Set API_URL in frontend/.env.local; see frontend/.env.example." })
  .parse(process.env.API_URL)

const TIMEOUT_MS = 5_000

// The backend is down, slow, or failing. Pages show a retry message for this;
// anything else is a bug and goes to the nearest error.tsx.
export class ApiUnavailableError extends Error {}

// The record the path names does not exist. Pages turn this into notFound().
export class ApiNotFoundError extends Error {}

// The record can no longer change as asked, for example because it was already
// answered. The message is the API's code for why, such as "already_accepted".
export class ApiConflictError extends Error {}

// The API refused the input. Its error codes, such as "blank" or "past", are
// keyed by field; the frontend writes the messages.
export type ValidationErrors = Record<string, string[]>

const validationErrorsSchema = z.object({ errors: z.record(z.string(), z.array(z.string())) })

const conflictSchema = z.object({ error: z.string() })

async function send(method: "GET" | "POST" | "PATCH", url: URL, payload?: unknown) {
  // fetch resolves once the headers arrive, so the body read belongs with the
  // transport: a stalled or dropped body is an outage, not a bad payload.
  try {
    const response = await fetch(url, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(payload !== undefined && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    })
    return { status: response.status, body: await response.text() }
  } catch (cause) {
    throw new ApiUnavailableError(`${method} ${url.pathname} failed`, { cause })
  }
}

function failure(method: string, url: URL, status: number) {
  const message = `${method} ${url.pathname} returned ${status}`
  if (status === 404) return new ApiNotFoundError(message)
  return status >= 500 ? new ApiUnavailableError(message) : new Error(message)
}

export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  params = new URLSearchParams(),
): Promise<T> {
  const url = new URL(path, API_URL)
  url.search = params.toString()

  const { status, body } = await send("GET", url)
  if (status < 200 || status >= 300) throw failure("GET", url, status)

  return schema.parse(JSON.parse(body))
}

export async function apiWrite<T>(
  method: "POST" | "PATCH",
  path: string,
  payload: unknown,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; errors: ValidationErrors }> {
  const url = new URL(path, API_URL)

  const { status, body } = await send(method, url, payload)
  if (status === 422) {
    return { ok: false, errors: validationErrorsSchema.parse(JSON.parse(body)).errors }
  }
  if (status === 409) throw new ApiConflictError(conflictSchema.parse(JSON.parse(body)).error)
  if (status < 200 || status >= 300) throw failure(method, url, status)

  return { ok: true, data: schema.parse(JSON.parse(body)) }
}
