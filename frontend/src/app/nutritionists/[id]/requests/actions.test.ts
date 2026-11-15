import { refresh } from "next/cache"
import { afterEach, describe, expect, it, vi } from "vitest"

import { answerRequest } from "@/app/nutritionists/[id]/requests/actions"

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ refresh: vi.fn() }))

function respondWith(response: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (response instanceof Error) throw response
      return response
    }),
  )
}

function answer(status: string) {
  const formData = new FormData()
  formData.set("status", status)
  return answerRequest("1", 7, { error: null }, formData)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(refresh).mockClear()
})

describe("answerRequest", () => {
  it("refreshes the list once the API takes the answer", async () => {
    respondWith(
      Response.json({ id: 7, status: "accepted", answered_at: "2026-11-20T12:00:00.000Z", rejected_ids: [9] }),
    )

    expect(await answer("accepted")).toEqual({ error: null })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("shows the API's reason when the request was already answered", async () => {
    respondWith(
      Response.json({ error: "This request was already rejected.", status: "rejected" }, { status: 409 }),
    )

    expect(await answer("accepted")).toEqual({ error: "This request was already rejected." })
    expect(refresh).not.toHaveBeenCalled()
  })

  it("shows the API's message for an answer it does not accept", async () => {
    respondWith(
      Response.json({ errors: { status: ["Answer with accepted or rejected."] } }, { status: 422 }),
    )

    expect(await answer("maybe")).toEqual({ error: "Answer with accepted or rejected." })
  })

  it("says the request is gone when the API cannot find it", async () => {
    respondWith(Response.json({ error: "AppointmentRequest not found" }, { status: 404 }))

    expect(await answer("accepted")).toEqual({ error: "This request no longer exists." })
  })

  it("asks to try again when the API is unavailable", async () => {
    respondWith(new TypeError("fetch failed"))

    expect(await answer("accepted")).toEqual({
      error: "We could not answer this request. Try again in a moment.",
    })
  })
})
