import { describe, expect, it } from "vitest"

import { formatterFor, translatorFor } from "@/test/translations"

const en = translatorFor("en-GB")
const pt = translatorFor("pt-PT")

describe("prices", () => {
  it("follows each language's convention and shows cents only when there are any", () => {
    const price = (locale: "en-GB" | "pt-PT", amount: number) => formatterFor(locale).number(amount, "price")

    expect(price("en-GB", 39)).toBe("€39")
    expect(price("en-GB", 19.5)).toBe("€19.50")
    expect(price("pt-PT", 39)).toBe("39\u00a0€")
    expect(price("pt-PT", 19.5)).toBe("19,50\u00a0€")
  })
})

describe("the confirmed request", () => {
  const sent = (t: typeof en, startsAt: string) =>
    t.markup("Appointment.sentDescription", {
      nutritionist: "Inês Araújo",
      service: "Follow-up",
      online: "false",
      start: new Date(startsAt),
      email: "carla@example.com",
      strong: (chunks) => chunks,
    })

  it("shows the start in Portuguese time, whatever zone renders it", () => {
    expect(sent(en, "2026-12-07T10:00:00Z")).toContain("Follow-up on Monday 7 December at 10:00.")
    expect(sent(en, "2027-07-05T09:00:00Z")).toContain("Follow-up on Monday 5 July at 10:00.")
    expect(sent(pt, "2027-07-05T09:00:00Z")).toContain("Follow-up no dia segunda-feira, 5 de julho às 10:00.")
  })
})

describe("the answered request toast", () => {
  const answered = (t: typeof en, answer: string, rejected: number) =>
    t("Requests.answered", { answer, guest: "Danilo Santos", rejected })

  it("names the guest and the answer", () => {
    expect(answered(en, "accepted", 0)).toBe("Accepted Danilo Santos's request.")
    expect(answered(en, "rejected", 0)).toBe("Rejected Danilo Santos's request.")
    expect(answered(pt, "accepted", 0)).toBe("Pedido de Danilo Santos aceite.")
  })

  it("counts the overlapping requests the API rejected", () => {
    expect(answered(en, "accepted", 1)).toBe("Accepted Danilo Santos's request. 1 overlapping request was rejected.")
    expect(answered(en, "accepted", 3)).toBe("Accepted Danilo Santos's request. 3 overlapping requests were rejected.")
    expect(answered(pt, "accepted", 1)).toBe("Pedido de Danilo Santos aceite. 1 pedido sobreposto foi rejeitado.")
    expect(answered(pt, "accepted", 3)).toBe("Pedido de Danilo Santos aceite. 3 pedidos sobrepostos foram rejeitados.")
  })
})
