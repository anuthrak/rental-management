import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { clearSession, getSession, isDemoMode } from "@/lib/auth/session"
import { getFloorPlanLayouts, getRoomCountsByFloor } from "@/lib/db/queries"
import { SettingsView } from "@/components/settings/settings-view"
import { GlobalStatusBar } from "@/components/global-status-bar"
import { ELECTRIC_RATE_USD, WATER_RATE_USD } from "@/lib/calc"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [session, demoMode] = await Promise.all([getSession(), isDemoMode()])

  // Demo visitors have no User row, so they get a read-only preview built
  // from the same stock defaults a brand-new account starts with, plus the
  // shared demo dataset's real per-floor room counts.
  if (!session) {
    if (!demoMode) redirect("/login")
    const roomCountsByFloor = await getRoomCountsByFloor(null)
    return (
      <SettingsView
        readOnly
        banner={<GlobalStatusBar />}
        userId={null}
        businessName=""
        currencyPreference="USD"
        defaultWaterRate={WATER_RATE_USD}
        defaultElectricRate={ELECTRIC_RATE_USD}
        invoiceNoteTemplate=""
        floorCount={1}
        simpleModeDefault={false}
        floorPlanLayouts={{}}
        roomCountsByFloor={roomCountsByFloor}
      />
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      businessName: true,
      currencyPreference: true,
      defaultWaterRate: true,
      defaultElectricRate: true,
      invoiceNoteTemplate: true,
      floorCount: true,
      simpleModeDefault: true,
    },
  })

  // A syntactically valid session token doesn't guarantee the user row it
  // points at still exists (deleted account, or a stale cookie survived a
  // reset DB) — same defensive check app/onboarding/page.tsx performs.
  if (!user) {
    await clearSession()
    redirect("/login")
  }

  const [floorPlanLayouts, roomCountsByFloor] = await Promise.all([
    getFloorPlanLayouts(session.userId),
    getRoomCountsByFloor(session.userId),
  ])

  return (
    <>
      <SettingsView
        banner={<GlobalStatusBar />}
        userId={session.userId}
        businessName={user.businessName ?? ""}
        currencyPreference={user.currencyPreference}
        defaultWaterRate={user.defaultWaterRate.toNumber()}
        defaultElectricRate={user.defaultElectricRate.toNumber()}
        invoiceNoteTemplate={user.invoiceNoteTemplate ?? ""}
        floorCount={user.floorCount}
        simpleModeDefault={user.simpleModeDefault}
        floorPlanLayouts={floorPlanLayouts}
        roomCountsByFloor={roomCountsByFloor}
      />
    </>
  )
}
