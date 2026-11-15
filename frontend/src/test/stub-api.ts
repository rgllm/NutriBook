import { expect, vi } from "vitest"

import { contractViolations } from "@/test/openapi-contract"

async function checkContract(url: URL, init: RequestInit, response: Response | Error) {
  const call = {
    method: init.method ?? "GET",
    url,
    body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
  }
  const isJson =
    response instanceof Response && response.headers.get("Content-Type")?.includes("application/json")
  const reply = isJson ? { status: response.status, body: await response.clone().json() } : undefined
  return contractViolations(call, reply)
}

// Answers every fetch with `response`, or rejects with it when it is an Error.
// Each call and its JSON reply must match openapi.yaml, so a fixture or request
// body the spec no longer describes fails the test. Pass checkContract: false
// only to test how the client handles a reply that breaks the contract.
export function stubApi(response: Response | Error, options = { checkContract: true }) {
  const fetch = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(async (url, init) => {
    // The client turns a throwing fetch into ApiUnavailableError, so a failed
    // check is recorded on the test instead of thrown.
    if (options.checkContract) {
      const violations = await checkContract(url, init, response).catch((error: unknown) => [String(error)])
      expect.soft(violations).toEqual([])
    }
    if (response instanceof Error) throw response
    return response
  })
  vi.stubGlobal("fetch", fetch)
  return fetch
}
