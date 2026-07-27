import { AlertTriangle, DollarSign, DoorOpen, ReceiptText } from "lucide-react"

import type { DashboardMetrics } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

export function KpiCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={DoorOpen}
        label="Occupancy Rate"
        value={`${metrics.occupiedCount} / ${metrics.totalRooms}`}
        sub={`${metrics.occupancyRate}% occupied`}
      />
      <KpiCard
        icon={DollarSign}
        label="Rent Collected (This Month)"
        value={formatCurrency(metrics.totalCollectedThisMonth, "USD")}
      />
      <KpiCard
        icon={AlertTriangle}
        label="Overdue Rent (This Month)"
        value={formatCurrency(metrics.totalOverdueThisMonth, "USD")}
      />
      <KpiCard
        icon={ReceiptText}
        label="Overdue Invoices"
        value={String(metrics.overdueInvoiceCount)}
      />
    </div>
  )
}
