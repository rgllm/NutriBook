import { NextResponse, type NextRequest } from "next/server"

export const config = { matcher: "/nutritionists/:id/requests" }

const REQUESTS_PATH = /^\/nutritionists\/[1-9]\d*\/requests$/

// With Cache Components the page sends its shell, and a 200, before it can
// call notFound(), so a malformed id only gets a real 404 here.
export function proxy(request: NextRequest) {
  if (REQUESTS_PATH.test(request.nextUrl.pathname)) return NextResponse.next()
  return NextResponse.rewrite(new URL("/404", request.url), { status: 404 })
}
