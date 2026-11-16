// The API names fields and error codes in snake_case ("starts_at",
// "not_a_slot"); message keys are camelCase ("startsAt", "notASlot").
export const toMessageKey = (code: string) => code.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
