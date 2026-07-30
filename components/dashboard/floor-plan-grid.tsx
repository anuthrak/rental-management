"use client"

import { useMemo } from "react"
import { User } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"

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

function byPosition(a: DashboardRoom, b: DashboardRoom): number {
  return a.position - b.position
}

function RoomBox({
  room,
  statusLabels,
  onOpenRoom,
}: {
  room: DashboardRoom
  statusLabels: Record<DashboardRoom["status"], string>
  onOpenRoom: (roomId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenRoom(room.id)}
      aria-label={`${room.roomNumber} — ${statusLabels[room.status]}${room.tenant ? `, ${room.tenant.fullName}` : ""}`}
      className={cn(
        "flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 px-2 py-2.5 text-center transition-transform active:scale-95 hover:shadow-md",
        BOX_STYLES[room.status],
      )}
    >
      <span className="flex items-center gap-1">
        {room.tenant ? (
          <User className="size-2.5 shrink-0 opacity-70" />
        ) : (
          <span className={cn("size-1.5 shrink-0 rounded-full", DOT_STYLES[room.status])} />
        )}
        <span className="truncate text-xs font-bold sm:text-sm">{room.roomNumber}</span>
      </span>
      {room.isVip && (
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary uppercase">
          VIP 2in1
        </span>
      )}
      <span className="text-[10px] font-semibold tabular-nums opacity-90">
        {compactPrice(room.targetPrice)}
      </span>
    </button>
  )
}

// A hatched divider representing a stairwell drawn between rooms on the
// sketch — purely decorative, positioned via each room's `stairAfter` flag.
function StairHatch() {
  return (
    <div
      role="img"
      aria-label="Stairwell"
      className="flex h-7 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-[8px] font-semibold tracking-widest text-muted-foreground/70 uppercase"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 4px, color-mix(in oklch, var(--muted-foreground) 25%, transparent) 4px, color-mix(in oklch, var(--muted-foreground) 25%, transparent) 5px)",
      }}
    >
      Stairs
    </div>
  )
}

function WingColumn({
  rooms,
  statusLabels,
  onOpenRoom,
  leadingStairHatch,
}: {
  rooms: DashboardRoom[]
  statusLabels: Record<DashboardRoom["status"], string>
  onOpenRoom: (roomId: string) => void
  leadingStairHatch?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      {leadingStairHatch && <StairHatch />}
      {rooms.map((room) => (
        <div key={room.id} className="flex flex-col gap-2">
          <RoomBox room={room} statusLabels={statusLabels} onOpenRoom={onOpenRoom} />
          {room.stairAfter && <StairHatch />}
        </div>
      ))}
    </div>
  )
}

export function FloorPlanGrid({
  rooms,
  floorLabel,
  onOpenRoom,
}: {
  rooms: DashboardRoom[]
  floorLabel: string
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()

  const statusLabels: Record<DashboardRoom["status"], string> = {
    VACANT: t("statusVacant"),
    OCCUPIED: t("statusOccupied"),
    MAINTENANCE: t("statusMaintenance"),
  }

  const { leftWing, topWing, rightWing, bottomFacade } = useMemo(() => {
    const byWing = (wing: string) =>
      rooms.filter((r) => r.wing === wing).sort(byPosition)
    return {
      leftWing: byWing("left_wing"),
      topWing: byWing("top_wing"),
      rightWing: byWing("right_wing"),
      bottomFacade: byWing("bottom_facade"),
    }
  }, [rooms])

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        {topWing.length > 0 && (
          <div className="flex justify-center">
            <div className="grid w-full max-w-xs grid-cols-1 gap-2 sm:max-w-sm">
              {topWing.map((room) => (
                <RoomBox key={room.id} room={room} statusLabels={statusLabels} onOpenRoom={onOpenRoom} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[minmax(88px,1fr)_2fr_minmax(88px,1fr)] items-start gap-3 sm:gap-4">
          <WingColumn rooms={leftWing} statusLabels={statusLabels} onOpenRoom={onOpenRoom} />

          <div className="flex min-h-[180px] items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/30 py-10">
            <span className="font-heading text-2xl font-bold tracking-widest text-muted-foreground/40 sm:text-3xl">
              {floorLabel}
            </span>
          </div>

          <WingColumn
            rooms={rightWing}
            statusLabels={statusLabels}
            onOpenRoom={onOpenRoom}
            leadingStairHatch={topWing.length > 0}
          />
        </div>

        {bottomFacade.length > 0 && (
          <div
            className="grid gap-2 rounded-b-2xl border-t border-dashed border-border/60 pt-3"
            style={{ gridTemplateColumns: `repeat(${bottomFacade.length}, minmax(0, 1fr))` }}
          >
            {bottomFacade.map((room) => (
              <RoomBox key={room.id} room={room} statusLabels={statusLabels} onOpenRoom={onOpenRoom} />
            ))}
          </div>
        )}

        {rooms.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("noRoomsMatch")}</p>
        )}
      </div>
    </div>
  )
}
