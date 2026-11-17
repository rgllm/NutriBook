// The API's names for the two answers, sent as they are.
export const REQUEST_ANSWERS = ["accepted", "rejected"] as const

export type RequestAnswer = (typeof REQUEST_ANSWERS)[number]

export type AnswerRequestState =
  | { status: "idle" }
  | { status: "answered"; answer: RequestAnswer; rejectedCount: number }
  | { status: "gone"; message: string }
  | { status: "failed"; error: string }
