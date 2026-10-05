"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { Info, Lock, Search, Shuffle, Unlock, User } from "lucide-react"
import { toast } from "sonner"

import type { DashboardRoom } from "@/lib/db/queries"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { updateRoomGridPositions } from "@/app/actions/floor-plan"
import {
  DEFAULT_DIMENSIONS,
  useFloorPlanLayoutStore,
  type FloorPlanDimensions,
  type GridCell,
  type GridPositionDiff,
} from "@/store/use-floor-plan-layout-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GridLayoutSetupModal } from "@/components/dashboard/grid-layout-setup-modal"

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

// Bigger and more tightly packed than a typical form-control grid on
// purpose — with price and the grip icon gone (see RoomBubbleVisual), the
// tiles read better as a solid floor-plan mosaic than as small, sparse
// badges with lots of visible background between them.
const CELL_SIZE = "5.5rem"
// Grid tracks are bounded on both ends via minmax(MIN_CELL_SIZE,
// MAX_CELL_SIZE) — MAX_CELL_SIZE is aliased to CELL_SIZE (not a second
// literal) so "today's default look, unchanged for typical grids" stays
// true by construction. MIN_CELL_SIZE is bumped slightly above the
// paper-estimate 3.25rem floor to keep RoomBubbleVisual's icon + room
// number from reading as cramped at the smallest size.
const MAX_CELL_SIZE = CELL_SIZE
const MIN_CELL_SIZE = "3.5rem"
const ROOM_DRAG_PREFIX = "room:"
const CELL_DROP_PREFIX = "cell:"
const TRAY_DROP_ID = "tray"
// Below this many unassigned rooms, a filter input is just clutter — a
// handful of bubbles are already scannable at a glance. Above it, typing a
// room number is faster than scrolling the (now height-bounded) tray.
const UNASSIGNED_FILTER_THRESHOLD = 10

function cellDropId(cell: GridCell): string {
  return `${CELL_DROP_PREFIX}${cell.row}:${cell.col}`
}

function parseCellDropId(id: string): GridCell | null {
  const match = id.match(/^cell:(\d+):(\d+)$/)
  if (!match) return null
  return { row: Number(match[1]), col: Number(match[2]) }
}

function byRoomNumber(a: DashboardRoom, b: DashboardRoom): number {
  return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
}

// Kept deliberately minimal — status color + room number is enough to place
// a room by sight. Price and a drag-handle icon used to live here too, but
// crammed into a ~76px tile they made every cell noisy; the grab cursor
// already signals draggability once editing is unlocked, and price is one
// tap away in every other view.
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
        "flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-0.5 text-center select-none",
        BOX_STYLES[room.status],
        dragging ? "shadow-lg" : !locked && "cursor-grab active:cursor-grabbing hover:shadow-md",
      )}
    >
      {room.tenant ? (
        <User className="size-3.5 shrink-0 opacity-70" />
      ) : (
        <span className={cn("size-2 shrink-0 rounded-full", DOT_STYLES[room.status])} />
      )}
      <span className="truncate text-sm font-bold">{room.roomNumber}</span>
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
      className={cn(
        // aspect-square (not a fixed size) so each cell's height always
        // matches whatever width the grid track gives it — see the grid
        // container below, whose tracks are bounded between MIN_CELL_SIZE
        // and MAX_CELL_SIZE rather than stretching unbounded to fill the
        // card when there are few columns.
        "flex aspect-square w-full items-center justify-center rounded-lg border transition-colors",
        // Locked reads as a clean, finished floor map — no editing
        // affordances. Unlocked shows dashed empty slots so it's obvious
        // where a dragged room can land.
        locked ? "border-transparent" : "border-dashed border-border/50",
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
  const [filter, setFilter] = useState("")

  const showFilter = rooms.length > UNASSIGNED_FILTER_THRESHOLD

  const visibleRooms = useMemo(() => {
    if (!showFilter) return rooms
    const q = filter.trim().toLowerCase()
    if (!q) return rooms
    return rooms.filter((room) => room.roomNumber.toLowerCase().includes(q))
  }, [rooms, filter, showFilter])

  return (
    <div className="flex flex-col gap-2 lg:h-full">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("unassignedRoomsLabel")} ({rooms.length})
      </p>
      {showFilter && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("filterUnassignedRoomsPlaceholder")}
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}
      <div
        ref={setNodeRef}
        className={cn(
          "flex max-h-48 flex-wrap content-start gap-1.5 overflow-y-auto rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 transition-colors lg:max-h-[32rem] lg:flex-1",
          isOver && !locked && "border-primary bg-primary/5",
        )}
      >
        {rooms.length === 0 ? (
          <p className="flex w-full items-center justify-center py-4 text-sm text-muted-foreground">
            {t("allRoomsPlacedLabel")}
          </p>
        ) : visibleRooms.length === 0 ? (
          <p className="flex w-full items-center justify-center py-4 text-sm text-muted-foreground">
            {t("noRoomsMatch")}
          </p>
        ) : (
          visibleRooms.map((room) => (
            <div key={room.id} style={{ width: CELL_SIZE, height: CELL_SIZE }} className="shrink-0">
              <RoomBubble room={room} locked={locked} onOpenRoom={onOpenRoom} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Rendered inside a Tooltip popup (dark bg, light text) rather than inline
// in the board's chrome row — see point 4 of the layout pass: the color
// legend is useful but doesn't need to occupy its own row when it's one
// info-icon tap/hover away.
function StatusLegend() {
  const { t } = useI18n()
  const items: { status: DashboardRoom["status"]; label: string }[] = [
    { status: "VACANT", label: t("statusVacant") },
    { status: "OCCUPIED", label: t("statusOccupied") },
    { status: "MAINTENANCE", label: t("statusMaintenance") },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {items.map(({ status, label }) => (
        <span key={status} className="flex items-center gap-1.5 text-xs">
          <span className={cn("size-2 shrink-0 rounded-full", DOT_STYLES[status])} />
          {label}
        </span>
      ))}
    </div>
  )
}

export function FloorPlanGridBoard({
  rooms,
  floor,
  userId,
  serverDimensions,
  onOpenRoom,
}: {
  rooms: DashboardRoom[]
  floor: number
  userId: string | null
  serverDimensions?: FloorPlanDimensions
  onOpenRoom: (roomId: string) => void
}) {
  const { t } = useI18n()
  const dimensions = useFloorPlanLayoutStore((s) => s.dimensionsByFloor[floor] ?? DEFAULT_DIMENSIONS)
  const storedPositions = useFloorPlanLayoutStore((s) => s.positionsByFloor[floor])
  const locked = useFloorPlanLayoutStore((s) => s.locked)
  const setPosition = useFloorPlanLayoutStore((s) => s.setPosition)
  const setPositions = useFloorPlanLayoutStore((s) => s.setPositions)
  const unassignRoom = useFloorPlanLayoutStore((s) => s.unassignRoom)
  const toggleLocked = useFloorPlanLayoutStore((s) => s.toggleLocked)
  const hydrateFloor = useFloorPlanLayoutStore((s) => s.hydrateFloor)
  const pruneFloor = useFloorPlanLayoutStore((s) => s.pruneFloor)

  const positions = storedPositions ?? {}

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Seed this floor from the server once — guest/demo sessions (no userId)
  // have no server copy, so they keep whatever this browser already has in
  // localStorage. storedPositions flips from undefined to a real object
  // after this runs, so it never re-fires for the same floor/owner.
  useEffect(() => {
    if (!userId || storedPositions !== undefined) return
    const initial: Record<string, GridCell> = {}
    for (const room of rooms) {
      if (room.gridRow != null && room.gridCol != null) {
        initial[room.id] = { row: room.gridRow, col: room.gridCol }
      }
    }
    hydrateFloor(floor, { dimensions: serverDimensions, positions: initial })
  }, [floor, userId, storedPositions, rooms, serverDimensions, hydrateFloor])

  // Drop cached positions for rooms that no longer exist (deleted since
  // the last visit) so the persisted blob doesn't grow forever.
  useEffect(() => {
    pruneFloor(floor, new Set(rooms.map((r) => r.id)))
  }, [floor, rooms, pruneFloor])

  function persist(diffs: GridPositionDiff[]) {
    if (!userId || diffs.length === 0) return
    startTransition(async () => {
      try {
        await updateRoomGridPositions(
          diffs.map((d) => ({
            roomId: d.roomId,
            gridRow: d.cell?.row ?? null,
            gridCol: d.cell?.col ?? null,
          })),
        )
      } catch {
        toast.error(t("gridSyncErrorToast"))
      }
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  const roomsById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms])

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
    () => rooms.filter((room) => !placedRoomIds.has(room.id)).sort(byRoomNumber),
    [rooms, placedRoomIds],
  )

  const freeCellCount = dimensions.rows * dimensions.cols - placedRoomIds.size
  const overflowCount = Math.max(0, unassignedRooms.length - freeCellCount)

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
      persist(unassignRoom(floor, roomId))
      return
    }

    const cell = parseCellDropId(overId)
    if (cell) persist(setPosition(floor, roomId, cell))
  }

  // Fills empty cells (row-major order) with the unassigned rooms, sorted
  // by room number, as a starting point the landlord can still hand-tweak —
  // dragging every room one at a time is a lot of taps for a full building.
  function handleAutoArrange() {
    const free: GridCell[] = []
    for (let row = 0; row < dimensions.rows && free.length < unassignedRooms.length; row++) {
      for (let col = 0; col < dimensions.cols && free.length < unassignedRooms.length; col++) {
        if (!occupantByCell.has(cellDropId({ row, col }))) free.push({ row, col })
      }
    }
    if (free.length === 0) return

    const assignments = unassignedRooms
      .slice(0, free.length)
      .map((room, i) => ({ roomId: room.id, cell: free[i] }))
    persist(setPositions(floor, assignments))
    toast.success(t("autoArrangeToast"))
  }

  const activeRoom = activeRoomId ? (roomsById.get(activeRoomId) ?? null) : null

  // One line of contextual copy instead of stacking a hint + a tip + a
  // warning on top of each other — the overflow warning always wins since
  // it's the one thing that actually blocks progress.
  const statusMessage =
    overflowCount > 0
      ? { text: `${t("gridOverflowWarning")} (${overflowCount})`, tone: "warning" as const }
      : !locked && placedRoomIds.size === 0 && unassignedRooms.length > 0
        ? { text: t("gridFirstRunTip"), tone: "tip" as const }
        : { text: locked ? t("gridLockedHint") : t("gridEditingHint"), tone: "muted" as const }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <p
            className={cn(
              "text-sm",
              statusMessage.tone === "warning" && "font-medium text-destructive",
              statusMessage.tone === "tip" && "font-medium text-primary",
              statusMessage.tone === "muted" && "text-muted-foreground",
            )}
          >
            {statusMessage.text}
          </p>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={t("statusLegendLabel")}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="size-3.5" />
                </button>
              }
            />
            <TooltipContent>
              <StatusLegend />
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <GridLayoutSetupModal floor={floor} userId={userId} />
          {!locked && unassignedRooms.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={handleAutoArrange}>
              <Shuffle />
              {t("autoArrangeAction")}
            </Button>
          )}
          <Toggle
            pressed={!locked}
            onPressedChange={() => toggleLocked()}
            variant="outline"
            size="sm"
            aria-label={locked ? t("unlockLayoutAction") : t("lockLayoutAction")}
            className="border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
          >
            {locked ? <Lock /> : <Unlock />}
            {locked ? t("lockedLabel") : t("editingLabel")}
          </Toggle>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col rounded-2xl border bg-card lg:flex-row lg:divide-x lg:divide-border">
          <div className="overflow-x-auto p-4 sm:p-6 lg:flex-1">
            <div
              className="grid w-full justify-center gap-1.5"
              style={{
                // Tracks are bounded on both ends (MIN_CELL_SIZE..MAX_CELL_SIZE)
                // so low column counts no longer balloon to fill the card —
                // once cols * MAX_CELL_SIZE is less than the available width,
                // justify-center (below) centers the track block instead of
                // stretching each track to fill the remaining space. Once
                // cols * MIN_CELL_SIZE exceeds the card's width, the min bound
                // takes over and the overflow-x-auto wrapper kicks in, same as
                // before. Rows are intentionally left implicit — each cell's
                // aspect-square height follows its own track's computed width,
                // keeping cells square either way.
                gridTemplateColumns: `repeat(${dimensions.cols}, minmax(${MIN_CELL_SIZE}, ${MAX_CELL_SIZE}))`,
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

          <div className="border-t border-border p-4 sm:p-6 lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-t-0">
            <UnassignedTray rooms={unassignedRooms} locked={locked} onOpenRoom={onOpenRoom} />
          </div>
        </div>

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
