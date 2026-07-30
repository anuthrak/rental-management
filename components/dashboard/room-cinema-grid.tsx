"use client"

import { useMemo, useState } from "react"
import { User } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"

type StatusFilter = "all" | DashboardRoom["status"]

const BOX_STYLES: Record<DashboardRoom["status"], string> = {
  VACANT: "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400",
  OCCUPIED: "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400",
  MAINTENANCE: "bg-muted border-border text-muted-foreground",
}

const DOT_STYLES: Record<DashboardRoom["status"], string> = {
  VACANT: "bg-emerald-500",
  OCCUPIED: "bg-amber-500",
  MAINTENANCE: "bg-muted-foreground/50",
}

function compactPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

// Strips a leading "Room " label so a box only has to fit the number itself
// (e.g. "Room 101" -> "101"); custom names pass through unchanged.
function shortLabel(roomNumber: string): string {
  return roomNumber.replace(/^room\s*/i, "").trim() || roomNumber
}

export function RoomCinemaGrid({
  rooms,
  onOpenRoom,
}: {
  rooms: DashboardRoom[]
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const filtered = useMemo(
    () => (statusFilter === "all" ? rooms : rooms.filter((r) => r.status === statusFilter)),
    [rooms, statusFilter],
  )

  const statusLabels: Record<DashboardRoom["status"], string> = {
    VACANT: t("statusVacant"),
    OCCUPIED: t("statusOccupied"),
    MAINTENANCE: t("statusMaintenance"),
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
      {/* Reserved for a future SVG/image floor-plan blueprint to sit behind
          the room boxes; the grid below stays in a positioned layer so a
          background can be dropped in without restructuring this component. */}
      <div className="relative z-10 flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {filtered.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onOpenRoom(room.id)}
              aria-label={`${room.roomNumber} — ${statusLabels[room.status]}${room.tenant ? `, ${room.tenant.fullName}` : ""}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 p-1 text-center transition-transform active:scale-95 hover:shadow-md",
                BOX_STYLES[room.status],
              )}
            >
              <span className="flex items-center gap-1">
                {room.tenant ? (
                  <User className="size-2.5 shrink-0 opacity-70" />
                ) : (
                  <span className={cn("size-1.5 shrink-0 rounded-full", DOT_STYLES[room.status])} />
                )}
                <span className="truncate text-sm font-bold sm:text-base">
                  {shortLabel(room.roomNumber)}
                </span>
              </span>
              <span className="text-[10px] font-semibold tabular-nums opacity-90 sm:text-xs">
                {compactPrice(room.targetPrice)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {t("noRoomsMatch")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-muted-foreground">
          {(["VACANT", "OCCUPIED", "MAINTENANCE"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === status ? "all" : status))}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-muted",
                statusFilter === status && "bg-muted font-medium text-foreground",
              )}
            >
              <span className={cn("size-2.5 rounded-full", DOT_STYLES[status])} />
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
