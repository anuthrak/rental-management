"use client"

import { useOnboardingStore } from "@/store/use-onboarding-store"
import { MAX_FLOOR_COUNT, MIN_FLOOR_COUNT } from "@/lib/rooms"
import { useI18n } from "@/components/i18n-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function StepFloors() {
  const { t } = useI18n()
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const floorCount = useOnboardingStore((s) => s.floorCount)
  const setFloorCount = useOnboardingStore((s) => s.setFloorCount)
  const roomsPerFloor = useOnboardingStore((s) => s.roomsPerFloor)
  const setRoomsPerFloor = useOnboardingStore((s) => s.setRoomsPerFloor)

  const totalRooms = roomsPerFloor.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-lg font-medium">{t("floorsStepHeading")}</h2>
        <p className="text-sm text-muted-foreground">{t("floorsStepDesc")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="floorCount">{t("floorCountField")}</Label>
        <Input
          id="floorCount"
          type="number"
          min={MIN_FLOOR_COUNT}
          max={MAX_FLOOR_COUNT}
          step="1"
          className="h-11 w-full sm:w-40"
          value={floorCount}
          onChange={(e) => setFloorCount(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: floorCount }, (_, i) => i).map((i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
            <Label htmlFor={`roomsOnFloor-${i}`}>
              F{i + 1} — {pricingModel === "standard" ? t("roomsOnFloorField") : t("floorCapacityField")}
            </Label>
            <Input
              id={`roomsOnFloor-${i}`}
              type="number"
              min={0}
              step="1"
              className="h-11 w-full sm:w-40"
              value={roomsPerFloor[i] ?? 0}
              onChange={(e) => setRoomsPerFloor(i, Number(e.target.value))}
            />
            {pricingModel === "custom" && (
              <p className="text-xs text-muted-foreground">{t("floorCapacityHelp")}</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm font-medium">
        {t("totalRoomsLabel")}: <span className="tabular-nums">{totalRooms}</span>
      </p>
    </div>
  )
}
