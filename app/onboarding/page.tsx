import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  return <OnboardingWizard />
}
