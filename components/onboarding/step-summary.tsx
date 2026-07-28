"use client"

import { useMemo } from "react"
import { CheckCircle2 } from "lucide-react"

import { resolveRooms, useOnboardingStore } from "@/store/use-onboarding-store"
import { formatCurrency } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", KHR: "៛" }

export function StepSummary({
  onComplete,
  isPending,
}: {
  onComplete: () => void
  isPending: boolean
}) {
  const { t } = useI18n()
  const propertyName = useOnboardingStore((s) => s.propertyName)
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const standardRoomCount = useOnboardingStore((s) => s.standardRoomCount)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const standardWaterMeterStart = useOnboardingStore((s) => s.standardWaterMeterStart)
  const standardElectricMeterStart = useOnboardingStore((s) => s.standardElectricMeterStart)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const rooms = useMemo(
    () =>
      resolveRooms({
        pricingModel,
        standardRoomCount,
        standardBaseRate,
        standardWaterMeterStart,
        standardElectricMeterStart,
        customRooms,
      }),
    [
      pricingModel,
      standardRoomCount,
      standardBaseRate,
      standardWaterMeterStart,
      standardElectricMeterStart,
      customRooms,
    ],
  )
  const tenants = useOnboardingStore((s) => s.tenants)
  const currency = useOnboardingStore((s) => s.currency)
  const waterRate = useOnboardingStore((s) => s.waterRate)
  const electricRate = useOnboardingStore((s) => s.electricRate)

  const totalMonthlyRent = rooms.reduce((sum, r) => sum + r.targetPrice, 0)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CheckCircle2 className="size-4" />
            </span>
            <h3 className="font-heading text-base font-medium">
              {propertyName || t("yourPropertyFallback")}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("roomsCreatedLabel")}</span>
              <span className="text-lg font-semibold tabular-nums">{rooms.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("activeTenantsAddedLabel")}</span>
              <span className="text-lg font-semibold tabular-nums">{tenants.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("totalMonthlyRentLabel")}</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(totalMonthlyRent, "USD")}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("defaultCurrencyField")}</span>
              <span className="text-lg font-semibold">
                {currency} ({CURRENCY_SYMBOL[currency]})
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("waterRateLabel")}</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(waterRate, "USD")}/m³
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("electricRateLabel")}</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(electricRate, "USD")}/kW
              </span>
            </div>
          </div>

          {rooms.length === 0 && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t("noRoomsAddedYetText")}
            </p>
          )}
        </CardContent>
      </Card>

      <Button onClick={onComplete} disabled={isPending} className="min-h-11 w-full">
        {isPending ? t("settingUpText") : t("completeSetupAction")}
      </Button>
    </div>
  )
}
