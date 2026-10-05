"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Search } from "lucide-react"

import type { DashboardRoom, FloorPlanDimensions } from "@/lib/db/queries"
import { getFloors } from "@/lib/db/queries"
import { getAttentionRooms } from "@/lib/needs-attention"
import { DEFAULT_FLOOR_COLS, DEFAULT_FLOOR_ROWS, formatFloorLabel } from "@/lib/rooms"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { DEFAULT_FLOOR_COUNT, useFloorPlanLayoutStore } from "@/store/use-floor-plan-layout-store"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { AddRoomCard } from "@/components/dashboard/add-room-card"
import { FloorPlanGrid } from "@/components/dashboard/floor-plan-grid"
import { FloorPlanGridBoard } from "@/components/dashboard/floor-plan-grid-board"
import { NeedsAttentionView } from "@/components/dashboard/needs-attention-view"
import { RoomCard } from "@/components/dashboard/room-card"
import { RoomCinemaGrid } from "@/components/dashboard/room-cinema-grid"
import { RoomDrawer } from "@/components/dashboard/room-drawer"

type FilterTab = "all" | "vacant" | "occupied"
type MainTab = "attention" | "all"
type ViewMode = "standard" | "grid" | "custom"
type FloorFilter = number | "all"

export function RoomGrid({
  rooms,
  currency,
  userId,
  floorPlanLayouts,
  floorCount,
  accountWaterRate,
  accountElectricRate,
  simpleModeDefault,
}: {
  rooms: DashboardRoom[]
  currency: Currency
  userId: string | null
  floorPlanLayouts: Record<number, FloorPlanDimensions>
  floorCount: number
  accountWaterRate: number
  accountElectricRate: number
  simpleModeDefault: boolean
}) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const storedFloorCount = useFloorPlanLayoutStore((s) => s.floorCount)
  const syncOwner = useFloorPlanLayoutStore((s) => s.syncOwner)
  const hydrateFloorCount = useFloorPlanLayoutStore((s) => s.hydrateFloorCount)
  const hydrateSimpleModeFromAccount = useSimpleModeStore((s) => s.hydrateFromAccount)
  const [mainTab, setMainTab] = useState<MainTab>(simpleMode ? "attention" : "all")
  const [viewMode, setViewMode] = useState<ViewMode>("standard")
  const [selectedFloor, setSelectedFloor] = useState<FloorFilter>("all")
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<FilterTab>("all")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [addRoomOpen, setAddRoomOpen] = useState(false)

  // Jump straight to the actionable view when Simple Mode is (de)activated,
  // rather than leaving whichever tab happened to be selected.
  useEffect(() => {
    setMainTab(simpleMode ? "attention" : "all")
  }, [simpleMode])

  // Guards against a shared device inheriting a previous account's (or a
  // guest session's) cached floor-plan state, then seeds floorCount from
  // the server once per account. Runs here — not inside the Custom Layout
  // board — since floorCount shapes the floor chips for every view, not
  // just that one.
  useEffect(() => {
    syncOwner(userId)
  }, [userId, syncOwner])
  useEffect(() => {
    if (userId) hydrateFloorCount(floorCount)
  }, [userId, floorCount, hydrateFloorCount])
  // Seeds Simple Mode from the signed-in account's saved default once per
  // browser (see hydrateFromAccount's own guard) — guest sessions keep
  // today's pure-localStorage behavior unchanged.
  useEffect(() => {
    if (userId) hydrateSimpleModeFromAccount(simpleModeDefault)
  }, [userId, simpleModeDefault, hydrateSimpleModeFromAccount])

  const attentionRooms = useMemo(() => getAttentionRooms(rooms), [rooms])

  // Floor chips are the union of floors real rooms occupy and the
  // account's declared floor count, so an empty floor the landlord has set
  // up in advance still gets a chip before any room exists on it. Guest
  // sessions use the same local store value — it just never round-trips
  // to a server for them, same as the rest of the Custom Layout state.
  const floors = useMemo(() => {
    const roomFloors = getFloors(rooms)
    const declaredCount = storedFloorCount ?? DEFAULT_FLOOR_COUNT
    const declaredFloors = Array.from({ length: declaredCount }, (_, i) => i + 1)
    return [...new Set([...roomFloors, ...declaredFloors])].sort((a, b) => a - b)
  }, [rooms, storedFloorCount])

  // The Custom Layout grid's coordinate space is per-floor (two floors can
  // each have their own room at row 0/col 0), so "All floors" doesn't make
  // sense as a combined canvas there. Covers both ways in: switching to the
  // Custom tab while "All floors" is selected, and switching to "All
  // floors" via the separate floor chips while already on the Custom tab.
  useEffect(() => {
    if (viewMode === "custom" && selectedFloor === "all" && floors.length > 0) {
      setSelectedFloor(floors[0])
    }
  }, [viewMode, selectedFloor, floors])

  const floorRooms = useMemo(
    () => (selectedFloor === "all" ? rooms : rooms.filter((room) => room.floor === selectedFloor)),
    [rooms, selectedFloor],
  )

  // Capacity source of truth for AddRoomCard/RoomDrawer's floor pickers —
  // deliberately derived from the server-fetched `floorPlanLayouts` prop
  // (not useFloorPlanLayoutStore's local/cached dimensionsByFloor, which can
  // be stale across tabs/devices or, for a guest, never round-trip to the
  // server at all). See Part A's capacity-enforcement spec.
  const roomCountsByFloor = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const room of rooms) counts[room.floor] = (counts[room.floor] ?? 0) + 1
    return counts
  }, [rooms])

  const floorCapacities = useMemo(() => {
    const caps: Record<number, number> = {}
    for (const f of floors) {
      const dims = floorPlanLayouts[f]
      caps[f] = (dims?.rows ?? DEFAULT_FLOOR_ROWS) * (dims?.cols ?? DEFAULT_FLOOR_COLS)
    }
    return caps
  }, [floors, floorPlanLayouts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return floorRooms.filter((room) => {
      if (tab === "vacant" && room.status !== "VACANT") return false
      if (tab === "occupied" && room.status !== "OCCUPIED") return false
      if (!q) return true
      return (
        room.roomNumber.toLowerCase().includes(q) ||
        (room.tenant?.fullName.toLowerCase().includes(q) ?? false)
      )
    })
  }, [floorRooms, query, tab])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null
  // floors is already the sorted union of declared range ∪ actual room
  // floors (see the comment above its useMemo) — its last element is
  // exactly the effective ceiling, matching resolveValidFloor's
  // server-side calculation in the common signed-in case. floors is always
  // non-empty in practice (declaredFloors alone spans 1..declaredCount with
  // declaredCount >= MIN_FLOOR_COUNT) — the fallback is defensive only.
  const resolvedFloorCount = floors.length > 0 ? floors[floors.length - 1] : (storedFloorCount ?? DEFAULT_FLOOR_COUNT)
  const addRoomDefaultFloor = typeof selectedFloor === "number" ? selectedFloor : 1

  if (rooms.length === 0) {
    return (
      <>
        <EmptyState
          icon={Building2}
          title={t("emptyDashboardTitle")}
          description={t("emptyDashboardDesc")}
          actionLabel={t("addFirstRoomAction")}
          onAction={() => setAddRoomOpen(true)}
        />
        <AddRoomCard
          open={addRoomOpen}
          onOpenChange={setAddRoomOpen}
          hideTrigger
          defaultFloor={addRoomDefaultFloor}
          floorCount={resolvedFloorCount}
          roomCountsByFloor={roomCountsByFloor}
          floorCapacities={floorCapacities}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4" data-tour="room-grid">
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="attention" className="flex-1 sm:flex-none">
            {t("needsAttentionTab")} ({attentionRooms.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1 sm:flex-none">
            {t("allRoomsTab")} ({rooms.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mainTab === "attention" ? (
        <NeedsAttentionView
          attentionRooms={attentionRooms}
          currency={currency}
          onOpenRoom={setSelectedRoomId}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedFloor("all")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  selectedFloor === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                {t("allFloorsLabel")}
              </button>
              {floors.map((floor) => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setSelectedFloor(floor)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    selectedFloor === floor
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:bg-muted",
                  )}
                >
                  {formatFloorLabel(floor)}
                </button>
              ))}
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="standard">{t("standardViewLabel")}</TabsTrigger>
                <TabsTrigger value="grid">{t("gridViewLabel")}</TabsTrigger>
                <TabsTrigger value="custom">{t("customLayoutViewLabel")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {viewMode === "custom" && selectedFloor !== "all" ? (
            <FloorPlanGridBoard
              rooms={floorRooms}
              floor={selectedFloor}
              userId={userId}
              serverDimensions={floorPlanLayouts[selectedFloor]}
              onOpenRoom={setSelectedRoomId}
            />
          ) : viewMode === "custom" ? (
            // Only reachable for the one render before the effect-free
            // auto-select above lands on a real floor (e.g. a brand-new
            // account with zero rooms/floors yet).
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("noRoomsMatch")}
            </p>
          ) : viewMode === "grid" ? (
            selectedFloor !== "all" && floorRooms.some((room) => room.wing) ? (
              <FloorPlanGrid
                rooms={floorRooms}
                floorLabel={formatFloorLabel(selectedFloor)}
                onOpenRoom={setSelectedRoomId}
              />
            ) : (
              <RoomCinemaGrid rooms={floorRooms} onOpenRoom={setSelectedRoomId} />
            )
          ) : (
            <>
              {!simpleMode && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("searchRoomTenant")}
                      className="pl-8"
                    />
                  </div>
                  <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
                    <TabsList>
                      <TabsTrigger value="all">{t("tabAll")}</TabsTrigger>
                      <TabsTrigger value="vacant">{t("tabVacant")}</TabsTrigger>
                      <TabsTrigger value="occupied">{t("tabOccupied")}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {filtered.map((room) => (
                  <RoomCard key={room.id} room={room} onClick={() => setSelectedRoomId(room.id)} />
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                    {t("noRoomsMatch")}
                  </p>
                )}
                <AddRoomCard
                  defaultFloor={addRoomDefaultFloor}
                  floorCount={resolvedFloorCount}
                  roomCountsByFloor={roomCountsByFloor}
                  floorCapacities={floorCapacities}
                />
              </div>
            </>
          )}
        </>
      )}

      <RoomDrawer
        room={selectedRoom}
        open={selectedRoomId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRoomId(null)
        }}
        floorCount={resolvedFloorCount}
        roomCountsByFloor={roomCountsByFloor}
        floorCapacities={floorCapacities}
        accountWaterRate={accountWaterRate}
        accountElectricRate={accountElectricRate}
      />
    </div>
  )
}
