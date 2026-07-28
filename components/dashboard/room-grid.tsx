"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { getAttentionRooms } from "@/lib/needs-attention"
import type { Currency } from "@/lib/types"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddRoomCard } from "@/components/dashboard/add-room-card"
import { NeedsAttentionView } from "@/components/dashboard/needs-attention-view"
import { RoomCard } from "@/components/dashboard/room-card"
import { RoomDrawer } from "@/components/dashboard/room-drawer"

type FilterTab = "all" | "vacant" | "occupied"
type MainTab = "attention" | "all"

export function RoomGrid({ rooms, currency }: { rooms: DashboardRoom[]; currency: Currency }) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const [mainTab, setMainTab] = useState<MainTab>(simpleMode ? "attention" : "all")
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<FilterTab>("all")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  // Jump straight to the actionable view when Simple Mode is (de)activated,
  // rather than leaving whichever tab happened to be selected.
  useEffect(() => {
    setMainTab(simpleMode ? "attention" : "all")
  }, [simpleMode])

  const attentionRooms = useMemo(() => getAttentionRooms(rooms), [rooms])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rooms.filter((room) => {
      if (tab === "vacant" && room.status !== "VACANT") return false
      if (tab === "occupied" && room.status !== "OCCUPIED") return false
      if (!q) return true
      return (
        room.roomNumber.toLowerCase().includes(q) ||
        (room.tenant?.fullName.toLowerCase().includes(q) ?? false)
      )
    })
  }, [rooms, query, tab])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null

  return (
    <div className="flex flex-col gap-4">
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
