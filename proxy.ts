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

// "/" is the property dashboard; "/payments" is the Payments route. The
// invoice generator ("/invoice") stays public — it's a standalone
// client-side tool that doesn't need an account. /onboarding lets demo mode
// through at this layer too, but the page itself requires a real session
// (onboarding updates a User row, which demo/guest mode doesn't have).
export const config = {
  matcher: ["/", "/payments/:path*", "/onboarding/:path*"],
}
