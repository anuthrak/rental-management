"use client"

import { useI18n } from "@/components/i18n-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UtilityRatesSection({
  waterRate,
  onWaterRateChange,
  electricRate,
  onElectricRateChange,
}: {
  waterRate: number
  onWaterRateChange: (value: number) => void
  electricRate: number
  onElectricRateChange: (value: number) => void
}) {
  const { t } = useI18n()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-medium">{t("utilityRatesSectionTitle")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-water-rate">{t("waterRateField")}</Label>
          <Input
            id="settings-water-rate"
            type="number"
            min={0}
            step="any"
            className="h-11 w-full"
            value={waterRate}
            onChange={(e) => onWaterRateChange(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-electric-rate">{t("electricRateField")}</Label>
          <Input
            id="settings-electric-rate"
            type="number"
            min={0}
            step="any"
            className="h-11 w-full"
            value={electricRate}
            onChange={(e) => onElectricRateChange(Number(e.target.value))}
          />
        </div>
      </div>
    </section>
  )
}
