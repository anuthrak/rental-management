"use server"

import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

// Resets the account's guided-tour flag and redirects to the dashboard with
// the same ?tour=1 query-param mechanism completeOnboarding already relies
// on — the dashboard's GuidedTour auto-launches once on seeing it, then
// strips it from the URL.
export async function replayGuidedTour(): Promise<never> {
  const session = await getSession()
  if (!session) redirect("/login")

  await prisma.user.update({ where: { id: session.userId }, data: { tourCompleted: false } })

  redirect("/?tour=1")
}
