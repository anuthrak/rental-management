import { cookies } from "next/headers"

import {
  DEMO_COOKIE,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/token"

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

export async function createSession(user: { id: string; email: string }): Promise<void> {
  const token = await signSessionToken({ userId: user.id, email: user.email })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function setDemoMode(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE, "true", {
    ...cookieOptions,
    maxAge: 60 * 60 * 24, // 1 day
  })
}

export async function clearDemoMode(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)
}

export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(DEMO_COOKIE)?.value === "true"
}
