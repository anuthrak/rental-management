import Link from "next/link"
import { Building2, Receipt, Wallet } from "lucide-react"

import { getDashboardMetrics, getRooms } from "@/lib/db/queries"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RoomGrid } from "@/components/dashboard/room-grid"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [rooms, metrics] = await Promise.all([getRooms(), getDashboardMetrics()])

  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">Property Dashboard</span>
            <span className="text-xs text-muted-foreground">40 rooms &middot; occupancy &amp; billing</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/payments"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <Wallet className="size-4" />
            Payments
          </Link>
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <Receipt className="size-4" />
            Invoice Generator
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <KpiCards metrics={metrics} />
        <RoomGrid rooms={rooms} />
      </div>
    </main>
  )
}
