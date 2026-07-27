import { User } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const STATUS_STYLES: Record<DashboardRoom["status"], string> = {
  OCCUPIED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  VACANT: "bg-muted text-muted-foreground",
  MAINTENANCE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
}

const STATUS_DOT_STYLES: Record<DashboardRoom["status"], string> = {
  OCCUPIED: "bg-emerald-500",
  VACANT: "bg-muted-foreground/40",
  MAINTENANCE: "bg-amber-500",
}

export function RoomCard({
  room,
  onClick,
}: {
  room: DashboardRoom
  onClick: () => void
}) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const statusLabels: Record<DashboardRoom["status"], string> = {
    OCCUPIED: t("statusOccupied"),
    VACANT: t("statusVacant"),
    MAINTENANCE: t("statusMaintenance"),
  }

  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="font-heading text-base font-semibold">{room.roomNumber}</span>
            {simpleMode ? (
              <span
                className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", STATUS_DOT_STYLES[room.status])}
                role="img"
                aria-label={statusLabels[room.status]}
              />
            ) : (
              <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[room.status])}>
                {statusLabels[room.status]}
              </Badge>
            )}
          </div>

          <div className="flex min-h-5 items-center gap-1.5 text-sm text-muted-foreground">
            {room.tenant ? (
              <>
                <User className="size-3.5" />
                <span className="truncate">{room.tenant.fullName}</span>
              </>
            ) : (
              <span className="text-muted-foreground/60">{t("noTenant")}</span>
            )}
          </div>

          <span className="text-lg font-medium tabular-nums">
            {formatCurrency(room.targetPrice, "USD")}
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </span>
        </CardContent>
      </Card>
    </button>
  )
}
