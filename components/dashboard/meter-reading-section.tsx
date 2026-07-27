"use client"

import { useState, useTransition } from "react"
import { Gauge, Plus } from "lucide-react"
import { toast } from "sonner"

import type { MeterReadingItem } from "@/lib/db/queries"
import { electricCost, waterCost } from "@/lib/calc"
import { formatCurrency, formatNumber } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { logMeterReading } from "@/app/actions/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MeterReadingSection({
  roomId,
  readings,
}: {
  roomId: string
  readings: MeterReadingItem[]
}) {
  const { t, locale } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [waterInput, setWaterInput] = useState("")
  const [electricInput, setElectricInput] = useState("")
  const [notesInput, setNotesInput] = useState("")

  const latest = readings[0] ?? null

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const water = Number(waterInput)
    const electric = Number(electricInput)
    if (waterInput === "" || electricInput === "" || water < 0 || electric < 0) {
      toast.error("Enter valid meter values")
      return
    }
    startTransition(async () => {
      await logMeterReading({ roomId, waterMeterValue: water, electricMeterValue: electric, notes: notesInput })
      toast.success("Meter reading logged")
      setWaterInput("")
      setElectricInput("")
      setNotesInput("")
      setShowForm(false)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-medium">{t("meterReadingsTitle")}</h3>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus data-icon="inline-start" />
            {t("logReadingAction")}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          {latest && (
            <p className="text-xs text-muted-foreground">
              {t("previousReadingLabel")}: {formatNumber(latest.waterMeterValue, locale)} m³ ·{" "}
              {formatNumber(latest.electricMeterValue, locale)} kWh
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="water-meter">{t("waterMeterField")}</Label>
              <Input
                id="water-meter"
                type="number"
                min="0"
                step="any"
                value={waterInput}
                onChange={(e) => setWaterInput(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="electric-meter">{t("electricMeterField")}</Label>
              <Input
                id="electric-meter"
                type="number"
                min="0"
                step="any"
                value={electricInput}
                onChange={(e) => setElectricInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meter-notes">{t("meterNotesField")}</Label>
            <Input id="meter-notes" value={notesInput} onChange={(e) => setNotesInput(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">
              {t("saveReadingAction")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      {readings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          {t("noReadingsYet")}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {readings.map((reading, index) => {
            const prior = readings[index + 1] ?? null
            const waterUsage = prior ? Math.max(0, reading.waterMeterValue - prior.waterMeterValue) : null
            const electricUsage = prior
              ? Math.max(0, reading.electricMeterValue - prior.electricMeterValue)
              : null
            return (
              <div key={reading.id} className="rounded-lg border border-border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gauge className="size-3.5 text-muted-foreground" />
                    {new Date(reading.readingDate).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">
                    {formatNumber(reading.waterMeterValue, locale)} m³ ·{" "}
                    {formatNumber(reading.electricMeterValue, locale)} kWh
                  </span>
                </div>
                {!simpleMode && (waterUsage !== null || electricUsage !== null) && (
                  <p className="mt-1 text-muted-foreground">
                    {waterUsage !== null &&
                      `${formatNumber(waterUsage, locale)} m³ (${formatCurrency(waterCost(waterUsage), "USD", locale)})`}
                    {waterUsage !== null && electricUsage !== null && " · "}
                    {electricUsage !== null &&
                      `${formatNumber(electricUsage, locale)} kWh (${formatCurrency(electricCost(electricUsage), "USD", locale)})`}
                  </p>
                )}
                {reading.notes && <p className="mt-1 text-muted-foreground">{reading.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
