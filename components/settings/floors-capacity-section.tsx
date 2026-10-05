"use client"

import { useEffect, useMemo } from "react"

import type { FloorPlanDimensions } from "@/lib/db/queries"
import { DEFAULT_FLOOR_COLS, DEFAULT_FLOOR_ROWS, formatFloorLabel } from "@/lib/rooms"
import { useI18n } from "@/components/i18n-provider"
import { useFloorPlanLayoutStore } from "@/store/use-floor-plan-layout-store"
import { GridLayoutSetupModal } from "@/components/dashboard/grid-layout-setup-modal"

export function FloorsCapacitySection({
  userId,
  initialFloorCount,
  floorPlanLayouts,
  roomCountsByFloor,
}: {
  userId: string | null
  initialFloorCount: number
  floorPlanLayouts: Record<number, FloorPlanDimensions>
  roomCountsByFloor: Record<number, number>
}) {
  const { t } = useI18n()
  const setDimensions = useFloorPlanLayoutStore((s) => s.setDimensions)

  // GridLayoutSetupModal normally relies on FloorPlanGridBoard (the
  // dashboard's Custom Layout view) to have already seeded
  // useFloorPlanLayoutStore's dimensionsByFloor from the server before it's
  // opened — a landlord who lands on Settings without ever visiting that
  // floor's board would otherwise see the modal's rows/cols pre-filled with
  // the generic DEFAULT_DIMENSIONS instead of their real saved grid size,
  // and silently overwrite it on Apply. Seed dimensions (not positions,
  // which this page never touches) directly from the server-fetched prop
  // here instead.
  useEffect(() => {
    for (const [floor, dims] of Object.entries(floorPlanLayouts)) {
      setDimensions(Number(floor), dims)
    }
  }, [floorPlanLayouts, setDimensions])

  // Union of the declared floor range and whatever floors actual rooms
  // already occupy — same "declared ∪ actual" pattern room-grid.tsx's
  // floors memo and resolveValidFloor use, so a floor with real rooms on it
  // is never hidden just because floorCount hasn't been raised to match.
  // Floor count itself is edited via the nested GridLayoutSetupModal (its
  // "Number of floors" field) — this list re-derives fresh from the props
  // the server re-fetches after that action's revalidatePath("/settings").
  const floors = useMemo(() => {
    const roomFloors = Object.keys(roomCountsByFloor).map(Number)
    const declaredFloors = Array.from({ length: initialFloorCount }, (_, i) => i + 1)
    return [...new Set([...roomFloors, ...declaredFloors])].sort((a, b) => a - b)
  }, [initialFloorCount, roomCountsByFloor])

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-medium">{t("floorsCapacitySectionTitle")}</h2>
      <div className="flex flex-col gap-2">
        {floors.map((floor) => {
          const used = roomCountsByFloor[floor] ?? 0
          const dims = floorPlanLayouts[floor]
          const capacity = (dims?.rows ?? DEFAULT_FLOOR_ROWS) * (dims?.cols ?? DEFAULT_FLOOR_COLS)
          return (
            <div
              key={floor}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{formatFloorLabel(floor)}</span>
                <span className="text-xs text-muted-foreground">
                  {t("floorSlotsUsedLabel")
                    .replace("{used}", String(used))
                    .replace("{capacity}", String(capacity))}
                </span>
              </div>
              <GridLayoutSetupModal floor={floor} userId={userId} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
