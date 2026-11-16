import { refresh } from "next/cache"
import { afterEach, describe, expect, it, vi } from "vitest"

import { answerRequest } from "@/app/nutritionists/[id]/requests/actions"

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ refresh: vi.fn() }))
vi.mock("next-intl/server", () => import("@/test/translations"))

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
  return answerRequest("1", 7, { status: "idle" }, formData)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(refresh).mockClear()
})

describe("answerRequest", () => {
  it("refreshes the list and reports the answer with the overlapping rejections", async () => {
    respondWith(
      Response.json({ id: 7, status: "accepted", answered_at: "2026-11-20T12:00:00.000Z", rejected_ids: [9, 10] }),
    )

    expect(await answer("accepted")).toEqual({ status: "answered", answer: "accepted", rejectedCount: 2 })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes away a request that was already answered and says why", async () => {
    respondWith(
      Response.json({ error: "already_rejected", status: "rejected" }, { status: 409 }),
    )

    expect(await answer("accepted")).toEqual({ status: "gone", message: "This request was already rejected." })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes away a request the API cannot find", async () => {
    respondWith(Response.json({ error: "AppointmentRequest not found" }, { status: 404 }))

    expect(await answer("accepted")).toEqual({ status: "gone", message: "This request no longer exists." })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes away a request for a conflict it has no message for", async () => {
    respondWith(Response.json({ error: "archived", status: "archived" }, { status: 409 }))

    expect(await answer("accepted")).toEqual({ status: "gone", message: "This request no longer exists." })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("keeps the card for an answer the API does not accept", async () => {
    respondWith(Response.json({ errors: { status: ["not_an_answer"] } }, { status: 422 }))

    expect(await answer("maybe")).toEqual({ status: "failed", error: "We could not answer this request." })
    expect(refresh).not.toHaveBeenCalled()
  })

  it("keeps the card and asks to try again when the API is unavailable", async () => {
    respondWith(new TypeError("fetch failed"))

    expect(await answer("accepted")).toEqual({
      status: "failed",
      error: "We could not answer this request. Try again in a moment.",
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})
