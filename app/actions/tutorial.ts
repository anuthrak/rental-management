"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

// No-ops for guests/demo mode (no User row to persist against) — localStorage
// alone covers that case. Registered users get the flag synced so the tour
// doesn't re-open on another device or after clearing local storage.
export async function markTourCompleted(): Promise<void> {
  const session = await getSession()
  if (!session) return
  await prisma.user.update({
    where: { id: session.userId },
    data: { tourCompleted: true },
  })
}
