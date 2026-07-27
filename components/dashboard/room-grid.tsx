"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import type { DashboardRoom } from "@/lib/db/queries"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoomCard } from "@/components/dashboard/room-card"
import { RoomDrawer } from "@/components/dashboard/room-drawer"

type FilterTab = "all" | "vacant" | "occupied"

export function RoomGrid({ rooms }: { rooms: DashboardRoom[] }) {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<FilterTab>("all")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search room or tenant..."
            className="pl-8"
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vacant">Vacant</TabsTrigger>
            <TabsTrigger value="occupied">Occupied</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {filtered.map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => setSelectedRoomId(room.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No rooms match your search.
          </p>
        )}
      </div>

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
