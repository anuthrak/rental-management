import { SignJWT, jwtVerify } from "jose"

// Pure JWT sign/verify with no next/headers dependency, so this module can
// be imported from middleware (Edge runtime) as well as Server Actions.
export const SESSION_COOKIE = "session"
export const DEMO_COOKIE = "demo_mode"
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

export type SessionPayload = {
  userId: string
  email: string
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(secret)
}

export function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null
    }
    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}
