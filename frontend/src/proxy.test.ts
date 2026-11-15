import { NextRequest } from "next/server"
import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server"
import { describe, expect, it } from "vitest"

import { proxy } from "@/proxy"

const visit = (path: string) => proxy(new NextRequest(new URL(path, "http://localhost:3000")))

describe("proxy", () => {
  it("lets well-formed nutritionist ids through to the page", () => {
    for (const id of ["1", "42", "9".repeat(20)]) {
      expect(isRewrite(visit(`/nutritionists/${id}/requests`))).toBe(false)
    }
  })

  it("answers malformed ids with the 404 page and status", () => {
    for (const id of ["0", "01", "-1", "1abc", "abc"]) {
      const response = visit(`/nutritionists/${id}/requests`)

      expect(response.status).toBe(404)
      expect(getRewrittenUrl(response)).toBe("http://localhost:3000/404")
    }
  })
})
