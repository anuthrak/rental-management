"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Search } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { getFloors } from "@/lib/db/queries"
import { getAttentionRooms } from "@/lib/needs-attention"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { AddRoomCard } from "@/components/dashboard/add-room-card"
import { FloorPlanGrid } from "@/components/dashboard/floor-plan-grid"
import { FloorPlanGridBoard } from "@/components/dashboard/floor-plan-grid-board"
import { GridLayoutSetupModal } from "@/components/dashboard/grid-layout-setup-modal"
import { NeedsAttentionView } from "@/components/dashboard/needs-attention-view"
import { RoomCard } from "@/components/dashboard/room-card"
import { RoomCinemaGrid } from "@/components/dashboard/room-cinema-grid"
import { RoomDrawer } from "@/components/dashboard/room-drawer"

type FilterTab = "all" | "vacant" | "occupied"
type MainTab = "attention" | "all"
type ViewMode = "standard" | "grid" | "custom"
type FloorFilter = number | "all"

// Ground floor is conventionally "GF" rather than "Floor 0"; upper floors
// use the common "F1"/"F2" shorthand instead of the more verbose "Floor N".
function formatFloorLabel(floor: number): string {
  return floor === 0 ? "GF" : `F${floor}`
}

export function RoomGrid({ rooms, currency }: { rooms: DashboardRoom[]; currency: Currency }) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
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

  const attentionRooms = useMemo(() => getAttentionRooms(rooms), [rooms])
  const floors = useMemo(() => getFloors(rooms), [rooms])

  const floorRooms = useMemo(
    () => (selectedFloor === "all" ? rooms : rooms.filter((room) => room.floor === selectedFloor)),
    [rooms, selectedFloor],
  )

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
        <AddRoomCard open={addRoomOpen} onOpenChange={setAddRoomOpen} hideTrigger />
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

          {viewMode === "custom" ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <GridLayoutSetupModal />
              </div>
              <FloorPlanGridBoard rooms={floorRooms} onOpenRoom={setSelectedRoomId} />
            </div>
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
                <AddRoomCard />
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
      />
    </div>
  )
}
