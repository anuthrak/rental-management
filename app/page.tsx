import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { getDashboardMetrics, getRooms, getUserCurrencyPreference } from "@/lib/db/queries"
import { getDisplayName } from "@/lib/user-display-name"
import { GlobalStatusBar } from "@/components/global-status-bar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { GreetingCard } from "@/components/dashboard/greeting-card"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RoomGrid } from "@/components/dashboard/room-grid"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  const scopeUserId = session ? session.userId : null

  const [rooms, metrics, currency, user] = await Promise.all([
    getRooms(scopeUserId),
    getDashboardMetrics(scopeUserId),
    getUserCurrencyPreference(scopeUserId),
    session
      ? prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
      : null,
  ])

  return (
    <>
      <DashboardHeader banner={<GlobalStatusBar />} />
      <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-6">
          {user && <GreetingCard name={getDisplayName(user)} />}
          <KpiCards metrics={metrics} />
          <RoomGrid rooms={rooms} currency={currency} />
        </div>
      </main>
    </>
  )
}
