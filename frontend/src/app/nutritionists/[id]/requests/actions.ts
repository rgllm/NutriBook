"use server"

import { revalidatePath } from "next/cache"

import {
  REQUEST_DECISIONS,
  removePendingRequest,
  type AnswerRequestState,
  type RequestDecision,
} from "@/lib/pending-requests"

const isDecision = (value: unknown): value is RequestDecision =>
  REQUEST_DECISIONS.includes(value as RequestDecision)

export async function answerRequest(
  requestId: string,
  _previous: AnswerRequestState,
  formData: FormData,
): Promise<AnswerRequestState> {
  if (!isDecision(formData.get("decision"))) {
    return { error: "Choose accept or reject." }
  }
  if (!removePendingRequest(requestId)) {
    return { error: "This request was already answered. Reload to see the current list." }
  }
  revalidatePath("/nutritionists/[id]/requests", "page")
  return { error: null }
}
