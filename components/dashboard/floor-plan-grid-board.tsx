"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { GripVertical, Lock, Unlock, User } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useFloorPlanLayoutStore, type GridCell } from "@/store/use-floor-plan-layout-store"
import { Toggle } from "@/components/ui/toggle"

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

const CELL_SIZE = "4.75rem"
const ROOM_DRAG_PREFIX = "room:"
const CELL_DROP_PREFIX = "cell:"
const TRAY_DROP_ID = "tray"

function compactPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function cellDropId(cell: GridCell): string {
  return `${CELL_DROP_PREFIX}${cell.row}:${cell.col}`
}

function parseCellDropId(id: string): GridCell | null {
  const match = id.match(/^cell:(\d+):(\d+)$/)
  if (!match) return null
  return { row: Number(match[1]), col: Number(match[2]) }
}

function RoomBubbleVisual({
  room,
  locked,
  dragging,
}: {
  room: DashboardRoom
  locked: boolean
  dragging?: boolean
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 p-1 text-center select-none",
        BOX_STYLES[room.status],
        dragging ? "shadow-lg" : !locked && "cursor-grab active:cursor-grabbing hover:shadow-md",
      )}
    >
      <span className="flex items-center gap-1">
        {room.tenant ? (
          <User className="size-2.5 shrink-0 opacity-70" />
        ) : (
          <span className={cn("size-1.5 shrink-0 rounded-full", DOT_STYLES[room.status])} />
        )}
        <span className="truncate text-xs font-bold">{room.roomNumber}</span>
        {!locked && !dragging && <GripVertical className="size-2.5 shrink-0 opacity-40" />}
      </span>
      <span className="text-[9px] font-semibold tabular-nums opacity-90">
        {compactPrice(room.targetPrice)}
      </span>
    </div>
  )
}

function RoomBubble({
  room,
  locked,
  onOpenRoom,
}: {
  room: DashboardRoom
  locked: boolean
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${ROOM_DRAG_PREFIX}${room.id}`,
    disabled: locked,
  })

  const statusLabels: Record<DashboardRoom["status"], string> = {
    VACANT: t("statusVacant"),
    OCCUPIED: t("statusOccupied"),
    MAINTENANCE: t("statusMaintenance"),
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpenRoom(room.id)}
      aria-label={`${room.roomNumber} — ${statusLabels[room.status]}${room.tenant ? `, ${room.tenant.fullName}` : ""}`}
      className={cn("h-full w-full touch-none transition-transform", isDragging && "opacity-0")}
      {...attributes}
      {...listeners}
    >
      <RoomBubbleVisual room={room} locked={locked} />
    </button>
  )
}

function GridCellDropzone({
  cell,
  locked,
  children,
}: {
  cell: GridCell
  locked: boolean
  children?: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cellDropId(cell), disabled: locked })

  return (
    <div
      ref={setNodeRef}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-dashed border-border/50 transition-colors",
        isOver && !locked && "border-primary border-solid bg-primary/10",
      )}
    >
      {children}
    </div>
  )
}

function UnassignedTray({
  rooms,
  locked,
  onOpenRoom,
}: {
  rooms: DashboardRoom[]
  locked: boolean
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_DROP_ID, disabled: locked })

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("unassignedRoomsLabel")} ({rooms.length})
      </p>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[4.75rem] flex-wrap gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 transition-colors",
          isOver && !locked && "border-primary bg-primary/5",
        )}
      >
        {rooms.length === 0 ? (
          <p className="flex w-full items-center justify-center py-4 text-sm text-muted-foreground">
            {t("allRoomsPlacedLabel")}
          </p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} style={{ width: CELL_SIZE, height: CELL_SIZE }} className="shrink-0">
              <RoomBubble room={room} locked={locked} onOpenRoom={onOpenRoom} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function FloorPlanGridBoard({
  rooms,
  onOpenRoom,
}: {
  rooms: DashboardRoom[]
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()
  const dimensions = useFloorPlanLayoutStore((s) => s.dimensions)
  const positions = useFloorPlanLayoutStore((s) => s.positions)
  const locked = useFloorPlanLayoutStore((s) => s.locked)
  const setPosition = useFloorPlanLayoutStore((s) => s.setPosition)
  const unassignRoom = useFloorPlanLayoutStore((s) => s.unassignRoom)
  const toggleLocked = useFloorPlanLayoutStore((s) => s.toggleLocked)

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  const roomsById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms])

  // Positions that reference a room outside this set (e.g. filtered to a
  // different floor) or a cell outside the current dimensions are ignored
  // rather than deleted, so they still apply once back in range.
  const placedRoomIds = useMemo(() => {
    const map = new Map<string, GridCell>()
    for (const room of rooms) {
      const cell = positions[room.id]
      if (cell && cell.row < dimensions.rows && cell.col < dimensions.cols) {
        map.set(room.id, cell)
      }
    }
    return map
  }, [rooms, positions, dimensions])

  const occupantByCell = useMemo(() => {
    const map = new Map<string, string>()
    placedRoomIds.forEach((cell, roomId) => map.set(cellDropId(cell), roomId))
    return map
  }, [placedRoomIds])

  const unassignedRooms = useMemo(
    () => rooms.filter((room) => !placedRoomIds.has(room.id)),
    [rooms, placedRoomIds],
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveRoomId(String(event.active.id).replace(ROOM_DRAG_PREFIX, ""))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveRoomId(null)
    const { active, over } = event
    if (!over) return

    const roomId = String(active.id).replace(ROOM_DRAG_PREFIX, "")
    const overId = String(over.id)

    if (overId === TRAY_DROP_ID) {
      unassignRoom(roomId)
      return
    }

    const cell = parseCellDropId(overId)
    if (cell) setPosition(roomId, cell)
  }

  const activeRoom = activeRoomId ? (roomsById.get(activeRoomId) ?? null) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2">
        <p className="text-sm text-muted-foreground">
          {locked ? t("gridLockedHint") : t("gridEditingHint")}
        </p>
        <Toggle
          pressed={!locked}
          onPressedChange={() => toggleLocked()}
          variant="outline"
          size="sm"
          aria-label={locked ? t("unlockLayoutAction") : t("lockLayoutAction")}
        >
          {locked ? <Lock /> : <Unlock />}
          {locked ? t("lockedLabel") : t("editingLabel")}
        </Toggle>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-2xl border bg-card p-4 sm:p-6">
          <div
            className="grid w-fit gap-2"
            style={{
              gridTemplateColumns: `repeat(${dimensions.cols}, ${CELL_SIZE})`,
              gridTemplateRows: `repeat(${dimensions.rows}, ${CELL_SIZE})`,
            }}
          >
            {Array.from({ length: dimensions.rows }).map((_, row) =>
              Array.from({ length: dimensions.cols }).map((_, col) => {
                const cell: GridCell = { row, col }
                const occupantId = occupantByCell.get(cellDropId(cell))
                const room = occupantId ? roomsById.get(occupantId) : undefined
                return (
                  <GridCellDropzone key={cellDropId(cell)} cell={cell} locked={locked}>
                    {room && <RoomBubble room={room} locked={locked} onOpenRoom={onOpenRoom} />}
                  </GridCellDropzone>
                )
              }),
            )}
          </div>
        </div>

        <UnassignedTray rooms={unassignedRooms} locked={locked} onOpenRoom={onOpenRoom} />

        <DragOverlay dropAnimation={null}>
          {activeRoom ? (
            <div style={{ width: CELL_SIZE, height: CELL_SIZE }}>
              <RoomBubbleVisual room={activeRoom} locked={locked} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
