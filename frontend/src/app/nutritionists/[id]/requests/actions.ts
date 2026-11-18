"use server"

import { refresh } from "next/cache"
import { getTranslations } from "next-intl/server"

import { toMessageKey } from "@/i18n/message-key"
import { answerAppointmentRequest } from "@/lib/api/appointment-requests"
import { ApiConflictError, ApiNotFoundError, ApiUnavailableError } from "@/lib/api/http"
import type { AnswerRequestState } from "@/lib/pending-requests"

// Refreshes whenever the request has left the pending list, whether this answer
// took it out or something else already had: the overlapping requests the API
// rejected leave with it, and a stale card does not linger. A conflict also
// refreshes when the request stays, so changed overlaps show before a retry.
export async function answerRequest(
  nutritionistId: string,
  requestId: number,
  overlappingIds: number[],
  _previous: AnswerRequestState,
  formData: FormData,
): Promise<AnswerRequestState> {
  const [t, tConflicts] = await Promise.all([
    getTranslations("requests"),
    getTranslations("requestConflicts"),
  ])

  try {
    const result = await answerAppointmentRequest(
      nutritionistId,
      requestId,
      String(formData.get("status") ?? ""),
      overlappingIds,
    )
    // The only invalid answer is a status the buttons never send.
    if (!result.ok) return { status: "failed", error: t("failed") }
    refresh()
    return {
      status: "answered",
      answer: result.data.status,
      rejectedCount: result.data.rejectedIds.length,
    }
  } catch (error) {
    if (error instanceof ApiConflictError) {
      refresh()
      const reason = toMessageKey(error.message) as Parameters<typeof tConflicts>[0]
      return { status: "gone", message: tConflicts.has(reason) ? tConflicts(reason) : t("gone") }
    }
    if (error instanceof ApiNotFoundError) {
      refresh()
      return { status: "gone", message: t("gone") }
    }
    if (error instanceof ApiUnavailableError) {
      return { status: "failed", error: t("unavailable") }
    }
    throw error
  }
}
