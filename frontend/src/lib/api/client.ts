import "server-only"

import { z } from "zod"

const API_URL = z
  .url({ error: "Set API_URL in frontend/.env.local; see frontend/.env.example." })
  .parse(process.env.API_URL)

const TIMEOUT_MS = 5_000

// The backend is down, slow, or failing. Pages show a retry message for this;
// anything else is a bug and goes to the nearest error.tsx.
export class ApiUnavailableError extends Error {}

export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  params = new URLSearchParams(),
): Promise<T> {
  const url = new URL(path, API_URL)
  url.search = params.toString()

  let response: Response
  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (cause) {
    throw new ApiUnavailableError(`GET ${url.pathname} failed`, { cause })
  }

  if (response.status >= 500) {
    throw new ApiUnavailableError(`GET ${url.pathname} returned ${response.status}`)
  }
  if (!response.ok) throw new Error(`GET ${url.pathname} returned ${response.status}`)

  return schema.parse(await response.json())
}
