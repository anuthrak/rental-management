import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { clearSession, getSession, isDemoMode } from "@/lib/auth/session"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage() {
  const [session, demoMode] = await Promise.all([getSession(), isDemoMode()])

  // Demo/guest visitors have no User row to write to — completeOnboarding
  // already bounces them to /login if they submit — but they should still
  // be able to click through the wizard UI itself (that's the point of the
  // "Test Onboarding" shortcut shown in demo mode).
  if (!session) {
    if (demoMode) {
      return <OnboardingWizard isDemoMode />
    }
    redirect("/login")
  }

  // A syntactically valid session token doesn't guarantee the user row it
  // points at still exists (deleted account, or a stale cookie survived a
  // reset DB). Confirm it here rather than letting the wizard render for a
  // user that completeOnboarding's writes would fail against later, and
  // don't let a transient DB error surface as an unhandled crash.
  let userExists = false
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    })
    userExists = !!user
  } catch (err) {
    console.error("[onboarding] failed to verify session user:", err)
  }

  if (!userExists) {
    await clearSession()
    redirect("/login")
  }

  return <OnboardingWizard />
}
