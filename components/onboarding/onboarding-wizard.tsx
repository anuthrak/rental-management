"use client"

import { useMemo, useTransition } from "react"
import { toast } from "sonner"

import { resolveRooms, useOnboardingStore } from "@/store/use-onboarding-store"
import { completeOnboarding, skipOnboarding } from "@/app/actions/onboarding"
import { useI18n } from "@/components/i18n-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { StepLanguage } from "@/components/onboarding/step-language"
import { StepProperty } from "@/components/onboarding/step-property"
import { StepTenants } from "@/components/onboarding/step-tenants"
import { StepPreferences } from "@/components/onboarding/step-preferences"
import { StepSummary } from "@/components/onboarding/step-summary"

export function OnboardingWizard() {
  const { t } = useI18n()
  const step = useOnboardingStore((s) => s.step)
  const setStep = useOnboardingStore((s) => s.setStep)
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
  const invoiceNoteTemplate = useOnboardingStore((s) => s.invoiceNoteTemplate)

  const [isPending, startTransition] = useTransition()

  function canProceedFromStep1(): boolean {
    if (!propertyName.trim()) return false
    if (pricingModel === "custom") {
      return (
        customRooms.length > 0 &&
        customRooms.every((r) => r.roomNumber.trim() && r.targetPrice > 0)
      )
    }
    return true
  }

  function handleNext() {
    if (step === 1 && !canProceedFromStep1()) {
      toast.error("Enter a property name, and make sure every custom room has a name and rate.")
      return
    }
    setStep(Math.min(4, step + 1))
  }

  function handleBack() {
    setStep(Math.max(0, step - 1))
  }

  function handleComplete() {
    const roomByDraftId = new Map(rooms.map((r) => [r.id, r]))
    startTransition(async () => {
      const result = await completeOnboarding({
        businessName: propertyName,
        currency,
        waterRate,
        electricRate,
        invoiceNoteTemplate,
        rooms: rooms.map((r) => ({ roomNumber: r.roomNumber, targetPrice: r.targetPrice })),
        tenants: tenants.map((t) => ({
          roomNumber: roomByDraftId.get(t.roomId)?.roomNumber ?? "",
          fullName: t.fullName,
          phone: t.phone,
          email: t.email,
          nationalId: t.nationalId,
          leaseStartDate: t.leaseStartDate,
          leaseEndDate: t.leaseEndDate,
          agreedRent: t.agreedRent,
          securityDeposit: t.securityDeposit,
          securityDepositStatus: t.securityDepositStatus,
          waterMeterStart: t.waterMeterStart,
          electricMeterStart: t.electricMeterStart,
        })),
      })
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        {step === 0 ? (
          <div />
        ) : (
          <div>
            <h1 className="font-heading text-xl font-semibold">Set up your property</h1>
            <p className="text-sm text-muted-foreground">
              A few quick steps to get your dashboard ready. You can change any of this later.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <form action={skipOnboarding}>
            <Button type="submit" variant="ghost" size="sm" className="min-h-11">
              {t("skipOnboarding")}
            </Button>
          </form>
        </div>
      </div>

      {step > 0 && <StepIndicator current={step} />}

      <div className="flex-1">
        {step === 0 && <StepLanguage onContinue={() => setStep(1)} />}
        {step === 1 && <StepProperty />}
        {step === 2 && <StepTenants />}
        {step === 3 && <StepPreferences />}
        {step === 4 && <StepSummary onComplete={handleComplete} isPending={isPending} />}
      </div>

      {step > 0 && (
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="min-h-11 flex-1 sm:flex-none"
          >
            {t("onboardingBack")}
          </Button>
          {step < 4 && (
            <Button type="button" onClick={handleNext} className="min-h-11 flex-1 sm:flex-none">
              {t("onboardingNext")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
