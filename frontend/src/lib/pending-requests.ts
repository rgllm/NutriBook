// The API's names for the two answers, sent as they are.
export const REQUEST_ANSWERS = ["accepted", "rejected"] as const

export type RequestAnswer = (typeof REQUEST_ANSWERS)[number]

// "answered" and "gone" both refresh the list, so the card unmounts and the
// form reports them in a toast. "failed" keeps the card, with the error on it,
// because trying again can work.
export type AnswerRequestState =
  | { status: "idle" }
  | { status: "answered"; answer: RequestAnswer; rejectedCount: number }
  | { status: "gone"; message: string }
  | { status: "failed"; error: string }

export function answeredMessage(answer: RequestAnswer, guestName: string, rejectedCount: number) {
  const answered = `${answer === "accepted" ? "Accepted" : "Rejected"} ${guestName}'s request.`
  if (rejectedCount === 0) return answered
  return rejectedCount === 1
    ? `${answered} 1 overlapping request was rejected.`
    : `${answered} ${rejectedCount} overlapping requests were rejected.`
}
