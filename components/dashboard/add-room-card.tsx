"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/components/i18n-provider"
import { dictionaries } from "@/lib/i18n"
import { createRoom } from "@/app/actions/dashboard"
import { DEFAULT_FLOOR_COLS, DEFAULT_FLOOR_ROWS, MIN_FLOOR_COUNT, deriveFloorFromRoomNumber } from "@/lib/rooms"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

function clampFloor(floor: number, floorCount: number): number {
  return Math.min(Math.max(floor, MIN_FLOOR_COUNT), floorCount)
}

export function AddRoomCard({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger = false,
  defaultFloor = 1,
  floorCount,
  roomCountsByFloor = {},
  floorCapacities = {},
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  defaultFloor?: number
  floorCount: number
  // Server-sourced capacity maps (see room-grid.tsx) — not read from
  // useFloorPlanLayoutStore, which can be stale across tabs/devices.
  roomCountsByFloor?: Record<number, number>
  floorCapacities?: Record<number, number>
}) {
  const { t } = useI18n()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState
  const [roomNumber, setRoomNumber] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [floor, setFloor] = useState(String(clampFloor(defaultFloor, floorCount)))
  const [floorTouched, setFloorTouched] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Re-seed the Floor field whenever the sheet opens, so a previous room's
  // manually-touched floor never leaks into the next one.
  useEffect(() => {
    if (!open) return
    setFloor(String(clampFloor(defaultFloor, floorCount)))
    setFloorTouched(false)
  }, [open, defaultFloor, floorCount])

  function handleRoomNumberChange(value: string) {
    setRoomNumber(value)
    if (!floorTouched) {
      setFloor(String(clampFloor(deriveFloorFromRoomNumber(value), floorCount)))
    }
  }

  function handleFloorChange(value: string) {
    setFloorTouched(true)
    setFloor(value)
  }

  const selectedFloorNum = Math.round(Number(floor))
  const floorUsed = Number.isFinite(selectedFloorNum) ? (roomCountsByFloor[selectedFloorNum] ?? 0) : 0
  const floorCapacity = Number.isFinite(selectedFloorNum)
    ? (floorCapacities[selectedFloorNum] ?? DEFAULT_FLOOR_ROWS * DEFAULT_FLOOR_COLS)
    : DEFAULT_FLOOR_ROWS * DEFAULT_FLOOR_COLS

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(targetPrice)
    if (!roomNumber.trim() || !price || price <= 0) {
      toast.error("Enter a room number and a valid target price")
      return
    }
    const floorNum = Math.round(Number(floor))
    if (!Number.isFinite(floorNum) || floorNum < MIN_FLOOR_COUNT || floorNum > floorCount) {
      toast.error(t("invalidRoomFloorError"))
      return
    }
    // Advisory only — the server's checkFloorCapacity is authoritative.
    // This just avoids a round trip for the common case and gives an
    // immediate error on the rare race where this client-side check passes
    // but the server rejects (stale capacity map, or another tab).
    if ((roomCountsByFloor[floorNum] ?? 0) >= (floorCapacities[floorNum] ?? DEFAULT_FLOOR_ROWS * DEFAULT_FLOOR_COLS)) {
      toast.error(t("floorFullError"))
      return
    }
    startTransition(async () => {
      const result = await createRoom({
        roomNumber: roomNumber.trim(),
        targetPrice: price,
        floor: floorNum,
      })
      if (!result.ok) {
        // The server returns the "room already exists" case as a free-text
        // string that has a real translation (roomExistsError); every other
        // server error here (floor-related) is intentionally shown raw in
        // both languages, matching this codebase's server-action-error
        // convention.
        toast.error(result.error === dictionaries.en.roomExistsError ? t("roomExistsError") : result.error)
        return
      }
      toast.success(t("roomCreatedToast"))
      setRoomNumber("")
      setTargetPrice("")
      setFloor(String(clampFloor(defaultFloor, floorCount)))
      setFloorTouched(false)
      setOpen(false)
    })
  }

  return (
    <>
      {!hideTrigger && (
        <button type="button" onClick={() => setOpen(true)} className="text-left">
          <Card className="h-full border-dashed transition-shadow hover:shadow-md">
            <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <Plus className="size-5" />
              <span className="text-sm font-medium">{t("addRoom")}</span>
            </CardContent>
          </Card>
        </button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="data-[side=right]:w-full sm:data-[side=right]:w-3/4">
          <SheetHeader className="border-b">
            <SheetTitle>{t("addRoomTitle")}</SheetTitle>
            <SheetDescription>{t("addRoomDesc")}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-room-number">{t("roomNumberField")}</Label>
              <Input
                id="new-room-number"
                value={roomNumber}
                onChange={(e) => handleRoomNumberChange(e.target.value)}
                placeholder="e.g. 205"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-room-price">{t("targetPriceField")}</Label>
              <Input
                id="new-room-price"
                type="number"
                min="0"
                step="1"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-room-floor">{t("floorField")}</Label>
              <Input
                id="new-room-floor"
                type="number"
                min={MIN_FLOOR_COUNT}
                max={floorCount}
                step={1}
                value={floor}
                onChange={(e) => handleFloorChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("floorSlotsUsedLabel")
                  .replace("{used}", String(floorUsed))
                  .replace("{capacity}", String(floorCapacity))}
              </p>
            </div>
            <Button type="submit" disabled={isPending} className="min-h-11">
              {t("createRoomAction")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
