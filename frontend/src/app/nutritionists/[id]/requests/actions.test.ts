import { refresh } from "next/cache"
import { afterEach, describe, expect, it, vi } from "vitest"

import { answerRequest } from "@/app/nutritionists/[id]/requests/actions"
import { stubApi } from "@/test/stub-api"

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ refresh: vi.fn() }))
vi.mock("next-intl/server", () => import("@/test/translations"))

function answer(status: string, overlappingIds: number[] = []) {
  const formData = new FormData()
  formData.set("status", status)
  return answerRequest("1", 7, overlappingIds, { status: "idle" }, formData)
}

afterEach(() => {
  vi.mocked(refresh).mockClear()
})

describe("answerRequest", () => {
  it("refreshes the list and reports the answer with the overlapping rejections", async () => {
    const fetch = stubApi(
      Response.json({ id: 7, status: "accepted", answered_at: "2026-11-20T12:00:00.000Z", rejected_ids: [9, 10] }),
    )

    expect(await answer("accepted", [9, 10])).toEqual({ status: "answered", answer: "accepted", rejectedCount: 2 })
    expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({
      appointment_request: { status: "accepted", overlapping_ids: [9, 10] },
    })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes the overlaps when accepting would reject a request that was not shown", async () => {
    stubApi(Response.json({ error: "overlaps_changed", status: "pending" }, { status: 409 }))

    expect(await answer("accepted", [9])).toEqual({
      status: "gone",
      message: "New requests overlap this one. Check the updated list and accept again.",
    })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes away a request that was already answered and says why", async () => {
    stubApi(
      Response.json({ error: "already_rejected", status: "rejected" }, { status: 409 }),
    )

    expect(await answer("accepted")).toEqual({ status: "gone", message: "This request was already rejected." })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes away a request the API cannot find", async () => {
    stubApi(Response.json({ error: "AppointmentRequest not found" }, { status: 404 }))

    expect(await answer("accepted")).toEqual({ status: "gone", message: "This request no longer exists." })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("refreshes away a request for a conflict it has no message for", async () => {
    stubApi(Response.json({ error: "archived", status: "archived" }, { status: 409 }), { checkContract: false })

    expect(await answer("accepted")).toEqual({ status: "gone", message: "This request no longer exists." })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("keeps the card for an answer the API does not accept", async () => {
    stubApi(Response.json({ errors: { status: ["not_an_answer"] } }, { status: 422 }))

    expect(await answer("maybe")).toEqual({ status: "failed", error: "We could not answer this request." })
    expect(refresh).not.toHaveBeenCalled()
  })

  it("keeps the card and asks to try again when the API is unavailable", async () => {
    stubApi(new TypeError("fetch failed"))

    expect(await answer("accepted")).toEqual({
      status: "failed",
      error: "We could not answer this request. Try again in a moment.",
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})
