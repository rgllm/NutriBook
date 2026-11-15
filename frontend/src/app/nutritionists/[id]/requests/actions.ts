"use server"

import { refresh } from "next/cache"

import { answerAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiConflictError, ApiNotFoundError, ApiUnavailableError } from "@/lib/api/http"
import type { AnswerRequestState } from "@/lib/pending-requests"

// On success the page refreshes, so the answered request and any overlapping
// requests the API rejected with it leave the list. A refused answer keeps the
// card and shows why.
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
    if (!result.ok) return { error: Object.values(result.errors).flat()[0] ?? null }
  } catch (error) {
    if (error instanceof ApiConflictError) return { error: error.message }
    if (error instanceof ApiNotFoundError) return { error: "This request no longer exists." }
    if (error instanceof ApiUnavailableError) {
      return { error: "We could not answer this request. Try again in a moment." }
    }
    throw error
  }

  refresh()
  return { error: null }
}
