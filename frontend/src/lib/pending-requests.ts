export const REQUEST_DECISIONS = ["accept", "reject"] as const

export type RequestDecision = (typeof REQUEST_DECISIONS)[number]

export type AnswerRequestState = { error: string | null }
