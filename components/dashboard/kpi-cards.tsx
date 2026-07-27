"use client"

import { AlertTriangle, CheckCircle2, DollarSign, DoorOpen, ReceiptText } from "lucide-react"

import type { DashboardMetrics } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
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
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)

  if (simpleMode) {
    const hasOverdue = metrics.overdueInvoiceCount > 0
    return (
      <Card>
        <CardContent className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              hasOverdue ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
            )}
          >
            {hasOverdue ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
          </span>
          {hasOverdue ? (
            <span className="text-base font-medium">
              <span className="font-heading font-semibold tabular-nums">
                {formatCurrency(metrics.totalOverdueThisMonth, "USD")}
              </span>{" "}
              {t("overdueSummaryLabel")}{" "}
              <span className="font-heading font-semibold tabular-nums">
                {metrics.overdueInvoiceCount}
              </span>{" "}
              {t("overdueSummaryInvoicesLabel")}
            </span>
          ) : (
            <span className="text-base font-medium">{t("allCaughtUpLabel")}</span>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={DoorOpen}
        label={t("kpiOccupancy")}
        value={`${metrics.occupiedCount} / ${metrics.totalRooms}`}
        sub={`${metrics.occupancyRate}% ${t("kpiOccupied")}`}
      />
      <KpiCard
        icon={DollarSign}
        label={t("kpiRentCollected")}
        value={formatCurrency(metrics.totalCollectedThisMonth, "USD")}
      />
      <KpiCard
        icon={AlertTriangle}
        label={t("kpiOverdueRent")}
        value={formatCurrency(metrics.totalOverdueThisMonth, "USD")}
      />
      <KpiCard
        icon={ReceiptText}
        label={t("kpiOverdueInvoices")}
        value={String(metrics.overdueInvoiceCount)}
      />
    </div>
  )
}
