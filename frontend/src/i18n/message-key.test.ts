import { describe, expect, it } from "vitest"

import { toMessageKey } from "@/i18n/message-key"

describe("toMessageKey", () => {
  it("turns the API's snake_case codes into camelCase message keys", () => {
    expect(toMessageKey("starts_at")).toBe("startsAt")
    expect(toMessageKey("not_a_slot")).toBe("notASlot")
    expect(toMessageKey("already_accepted")).toBe("alreadyAccepted")
  })

  it("keeps a single-word code as it is", () => {
    expect(toMessageKey("blank")).toBe("blank")
  })
})
