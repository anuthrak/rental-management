import { getSession } from "@/lib/auth/session"
import { getDashboardMetrics, getRooms } from "@/lib/db/queries"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RoomGrid } from "@/components/dashboard/room-grid"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  const scopeUserId = session ? session.userId : null

  const [rooms, metrics] = await Promise.all([
    getRooms(scopeUserId),
    getDashboardMetrics(scopeUserId),
  ])

  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <DashboardHeader />

      <div className="flex flex-col gap-6">
        <KpiCards metrics={metrics} />
        <RoomGrid rooms={rooms} />
      </div>
    </main>
  )
}
