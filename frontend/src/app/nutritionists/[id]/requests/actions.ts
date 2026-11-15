"use server"

import { refresh } from "next/cache"

import { answerAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiConflictError, ApiNotFoundError, ApiUnavailableError } from "@/lib/api/http"
import type { AnswerRequestState } from "@/lib/pending-requests"

// Refreshes whenever the request has left the pending list, whether this answer
// took it out or something else already had: the overlapping requests the API
// rejected leave with it, and a stale card does not linger.
export async function answerRequest(
  nutritionistId: string,
  requestId: number,
  _previous: AnswerRequestState,
  formData: FormData,
): Promise<AnswerRequestState> {
  try {
    const result = await answerAppointmentRequest(
      nutritionistId,
      requestId,
      String(formData.get("status") ?? ""),
    )
    if (!result.ok) {
      const [error = "We could not answer this request."] = Object.values(result.errors).flat()
      return { status: "failed", error }
    }
    refresh()
    return {
      status: "answered",
      answer: result.data.status,
      rejectedCount: result.data.rejectedIds.length,
    }
  } catch (error) {
    if (error instanceof ApiConflictError) {
      refresh()
      return { status: "gone", message: error.message }
    }
    if (error instanceof ApiNotFoundError) {
      refresh()
      return { status: "gone", message: "This request no longer exists." }
    }
    if (error instanceof ApiUnavailableError) {
      return { status: "failed", error: "We could not answer this request. Try again in a moment." }
    }
    throw error
  }
}
