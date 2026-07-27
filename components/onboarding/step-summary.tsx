"use client"

import { useMemo } from "react"
import { CheckCircle2 } from "lucide-react"

import { resolveRooms, useOnboardingStore } from "@/store/use-onboarding-store"
import { formatCurrency } from "@/lib/currency"
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
  const propertyName = useOnboardingStore((s) => s.propertyName)
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const standardRoomCount = useOnboardingStore((s) => s.standardRoomCount)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const rooms = useMemo(
    () => resolveRooms({ pricingModel, standardRoomCount, standardBaseRate, customRooms }),
    [pricingModel, standardRoomCount, standardBaseRate, customRooms],
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
              {propertyName || "Your property"}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Rooms created</span>
              <span className="text-lg font-semibold tabular-nums">{rooms.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Active tenants added</span>
              <span className="text-lg font-semibold tabular-nums">{tenants.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Total monthly rent (rooms)</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(totalMonthlyRent, "USD")}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Default currency</span>
              <span className="text-lg font-semibold">
                {currency} ({CURRENCY_SYMBOL[currency]})
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Water rate</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(waterRate, "USD")}/m³
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Electricity rate</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(electricRate, "USD")}/kW
              </span>
            </div>
          </div>

          {rooms.length === 0 && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              No rooms have been added yet — you can still complete setup and add rooms later
              from the dashboard.
            </p>
          )}
        </CardContent>
      </Card>

      <Button onClick={onComplete} disabled={isPending} className="min-h-11 w-full">
        {isPending ? "Setting up..." : "Complete Setup"}
      </Button>
    </div>
  )
}
