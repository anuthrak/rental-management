import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { DEMO_COOKIE, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token"

export async function proxy(request: NextRequest) {
  if (request.cookies.get(DEMO_COOKIE)?.value === "true") {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null
  if (session) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("from", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

// /dashboard covers both the property dashboard and /dashboard/payments (the
// live Payments route). /payments and /invoices are matched defensively in
// case those routes are introduced at the top level later. /onboarding lets
// demo mode through at this layer too, but the page itself requires a real
// session (onboarding updates a User row, which demo/guest mode doesn't have).
export const config = {
  matcher: ["/dashboard/:path*", "/payments/:path*", "/invoices/:path*", "/onboarding/:path*"],
}
