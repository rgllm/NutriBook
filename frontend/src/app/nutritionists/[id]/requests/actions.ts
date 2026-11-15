"use server"

import {
  REQUEST_DECISIONS,
  type AnswerRequestState,
  type RequestDecision,
} from "@/lib/pending-requests"

const isDecision = (value: unknown): value is RequestDecision =>
  REQUEST_DECISIONS.includes(value as RequestDecision)

// The API cannot answer requests yet, so a valid decision changes nothing and
// the request stays pending.
export async function answerRequest(
  _requestId: number,
  _previous: AnswerRequestState,
  formData: FormData,
): Promise<AnswerRequestState> {
  if (!isDecision(formData.get("decision"))) {
    return { error: "Choose accept or reject." }
  }
  return { error: null }
}
