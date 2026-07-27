"use client"

import { Plus, Trash2 } from "lucide-react"

import { useOnboardingStore } from "@/store/use-onboarding-store"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { formatCurrency } from "@/lib/currency"
import { AdvancedSection } from "@/components/simple-mode/advanced-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function StepProperty() {
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const propertyName = useOnboardingStore((s) => s.propertyName)
  const setPropertyName = useOnboardingStore((s) => s.setPropertyName)
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const setPricingModel = useOnboardingStore((s) => s.setPricingModel)
  const standardRoomCount = useOnboardingStore((s) => s.standardRoomCount)
  const setStandardRoomCount = useOnboardingStore((s) => s.setStandardRoomCount)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const setStandardBaseRate = useOnboardingStore((s) => s.setStandardBaseRate)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const addCustomRoom = useOnboardingStore((s) => s.addCustomRoom)
  const updateCustomRoom = useOnboardingStore((s) => s.updateCustomRoom)
  const removeCustomRoom = useOnboardingStore((s) => s.removeCustomRoom)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="propertyName">Property / business name</Label>
        <Input
          id="propertyName"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder="e.g. Riverside Apartments"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Pricing model</Label>
        <div className={cn("grid gap-3", !simpleMode && "sm:grid-cols-2")}>
          <button
            type="button"
            onClick={() => setPricingModel("standard")}
            className={cn(
              "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
              pricingModel === "standard"
                ? "border-primary bg-accent"
                : "border-border hover:bg-muted",
            )}
          >
            <span className="font-medium">Standardized</span>
            <span className="text-sm text-muted-foreground">
              Auto-generate rooms with one base rate — quick setup for uniform pricing.
            </span>
          </button>
          {!simpleMode && (
            <button
              type="button"
              onClick={() => setPricingModel("custom")}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
                pricingModel === "custom"
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="font-medium">Custom</span>
              <span className="text-sm text-muted-foreground">
                Add each room by hand with its own name and rate.
              </span>
            </button>
          )}
        </div>
        {simpleMode && (
          <AdvancedSection>
            <button
              type="button"
              onClick={() => setPricingModel("custom")}
              className={cn(
                "flex w-full flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
                pricingModel === "custom"
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="font-medium">Custom</span>
              <span className="text-sm text-muted-foreground">
                Add each room by hand with its own name and rate.
              </span>
            </button>
          </AdvancedSection>
        )}
      </div>

      {pricingModel === "standard" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="roomCount">Number of rooms</Label>
            <Input
              id="roomCount"
              type="number"
              min={0}
              step="1"
              value={standardRoomCount}
              onChange={(e) => setStandardRoomCount(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baseRate">Base rate ($/mo)</Label>
            <Input
              id="baseRate"
              type="number"
              min={0}
              step="any"
              value={standardBaseRate}
              onChange={(e) => setStandardBaseRate(Number(e.target.value))}
            />
          </div>
          {standardRoomCount > 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Will create <strong>Room 101</strong> through{" "}
              <strong>Room {100 + standardRoomCount}</strong>, each at{" "}
              {formatCurrency(standardBaseRate, "USD")}/mo.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {customRooms.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No rooms yet. Add one to get started.
            </p>
          )}
          {customRooms.map((room, index) => (
            <div key={room.id} className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="mb-1 text-xs text-muted-foreground">Room name</Label>
                <Input
                  value={room.roomNumber}
                  placeholder={`e.g. Room ${index + 1}`}
                  onChange={(e) => updateCustomRoom(room.id, { roomNumber: e.target.value })}
                />
              </div>
              <div className="w-32">
                <Label className="mb-1 text-xs text-muted-foreground">Rate ($/mo)</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={room.targetPrice}
                  onChange={(e) =>
                    updateCustomRoom(room.id, { targetPrice: Number(e.target.value) })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5"
                aria-label={`Remove ${room.roomNumber || "room"}`}
                onClick={() => removeCustomRoom(room.id)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={addCustomRoom}>
              <Plus data-icon="inline-start" />
              Add room
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
