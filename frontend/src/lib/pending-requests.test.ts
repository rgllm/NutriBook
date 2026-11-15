import { describe, expect, it } from "vitest"

import { answeredMessage } from "@/lib/pending-requests"

describe("answeredMessage", () => {
  it("names the guest and the answer", () => {
    expect(answeredMessage("accepted", "Danilo Santos", 0)).toBe("Accepted Danilo Santos's request.")
    expect(answeredMessage("rejected", "Rita Gomes", 0)).toBe("Rejected Rita Gomes's request.")
  })

  it("counts the overlapping requests the API rejected", () => {
    expect(answeredMessage("accepted", "Danilo Santos", 1)).toBe(
      "Accepted Danilo Santos's request. 1 overlapping request was rejected.",
    )
    expect(answeredMessage("accepted", "Danilo Santos", 3)).toBe(
      "Accepted Danilo Santos's request. 3 overlapping requests were rejected.",
    )
  })
})
