"use client"

import { Plus, Trash2 } from "lucide-react"

import { useOnboardingStore } from "@/store/use-onboarding-store"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { formatCurrency } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { AdvancedSection } from "@/components/simple-mode/advanced-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function StepProperty() {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const propertyName = useOnboardingStore((s) => s.propertyName)
  const setPropertyName = useOnboardingStore((s) => s.setPropertyName)
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const setPricingModel = useOnboardingStore((s) => s.setPricingModel)
  const standardRoomCount = useOnboardingStore((s) => s.standardRoomCount)
  const setStandardRoomCount = useOnboardingStore((s) => s.setStandardRoomCount)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const setStandardBaseRate = useOnboardingStore((s) => s.setStandardBaseRate)
  const standardWaterMeterStart = useOnboardingStore((s) => s.standardWaterMeterStart)
  const setStandardWaterMeterStart = useOnboardingStore((s) => s.setStandardWaterMeterStart)
  const standardElectricMeterStart = useOnboardingStore((s) => s.standardElectricMeterStart)
  const setStandardElectricMeterStart = useOnboardingStore((s) => s.setStandardElectricMeterStart)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const addCustomRoom = useOnboardingStore((s) => s.addCustomRoom)
  const updateCustomRoom = useOnboardingStore((s) => s.updateCustomRoom)
  const removeCustomRoom = useOnboardingStore((s) => s.removeCustomRoom)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="propertyName">{t("propertyNameField")}</Label>
        <Input
          id="propertyName"
          className="h-11 w-full"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder={t("propertyNamePlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("pricingModelField")}</Label>
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
            <span className="font-medium">{t("pricingStandardTitle")}</span>
            <span className="text-sm text-muted-foreground">{t("pricingStandardDesc")}</span>
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
              <span className="font-medium">{t("pricingCustomTitle")}</span>
              <span className="text-sm text-muted-foreground">{t("pricingCustomDesc")}</span>
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
              <span className="font-medium">{t("pricingCustomTitle")}</span>
              <span className="text-sm text-muted-foreground">{t("pricingCustomDesc")}</span>
            </button>
          </AdvancedSection>
        )}
      </div>

      {pricingModel === "standard" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="roomCount">{t("numberOfRoomsField")}</Label>
            <Input
              id="roomCount"
              type="number"
              min={0}
              step="1"
              className="h-11 w-full"
              value={standardRoomCount}
              onChange={(e) => setStandardRoomCount(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baseRate">{t("baseRateField")}</Label>
            <Input
              id="baseRate"
              type="number"
              min={0}
              step="any"
              className="h-11 w-full"
              value={standardBaseRate}
              onChange={(e) => setStandardBaseRate(Number(e.target.value))}
            />
          </div>
          {standardRoomCount > 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              {t("willCreateRoomsPrefix")} <strong>Room 101</strong> {t("willCreateRoomsThrough")}{" "}
              <strong>Room {100 + standardRoomCount}</strong>, {t("willCreateRoomsSuffix")}{" "}
              {formatCurrency(standardBaseRate, "USD")}
              {t("perMonthSuffix")}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="standardWaterMeterStart">{t("waterMeterStartField")}</Label>
            <Input
              id="standardWaterMeterStart"
              type="number"
              min={0}
              step="any"
              className="h-11 w-full"
              value={standardWaterMeterStart}
              onChange={(e) => setStandardWaterMeterStart(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="standardElectricMeterStart">{t("electricMeterStartField")}</Label>
            <Input
              id="standardElectricMeterStart"
              type="number"
              min={0}
              step="any"
              className="h-11 w-full"
              value={standardElectricMeterStart}
              onChange={(e) => setStandardElectricMeterStart(Number(e.target.value))}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {customRooms.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noRoomsYetText")}
            </p>
          )}
          {customRooms.map((room, index) => (
            <div
              key={room.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="mb-1 text-xs text-muted-foreground">{t("roomNameField")}</Label>
                  <Input
                    className="h-11 w-full"
                    value={room.roomNumber}
                    placeholder={`e.g. Room ${index + 1}`}
                    onChange={(e) => updateCustomRoom(room.id, { roomNumber: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 sm:w-32 sm:flex-none">
                    <Label className="mb-1 text-xs text-muted-foreground">{t("rateField")}</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      className="h-11 w-full"
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
                    className="h-11 w-11 shrink-0"
                    aria-label={`${t("removeAction")} ${room.roomNumber || ""}`}
                    onClick={() => removeCustomRoom(room.id)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1 text-xs text-muted-foreground">
                    {t("waterMeterStartField")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    className="h-11 w-full"
                    value={room.waterMeterStart}
                    onChange={(e) =>
                      updateCustomRoom(room.id, { waterMeterStart: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1 text-xs text-muted-foreground">
                    {t("electricMeterStartField")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    className="h-11 w-full"
                    value={room.electricMeterStart}
                    onChange={(e) =>
                      updateCustomRoom(room.id, { electricMeterStart: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={addCustomRoom}>
              <Plus data-icon="inline-start" />
              {t("addRoom")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
