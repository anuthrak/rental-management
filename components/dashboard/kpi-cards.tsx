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
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
          <span className="truncate font-heading text-xl font-semibold tabular-nums sm:text-2xl">
            {value}
          </span>
          {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:size-9">
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
