"use client"

import { useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { resolveRooms, useOnboardingStore } from "@/store/use-onboarding-store"
import { completeOnboarding, skipOnboarding } from "@/app/actions/onboarding"
import { MAX_FLOOR_COUNT, MIN_FLOOR_COUNT } from "@/lib/rooms"
import { useI18n } from "@/components/i18n-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { DemoPreviewDialog } from "@/components/demo-preview-dialog"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { StepLanguage } from "@/components/onboarding/step-language"
import { StepProperty } from "@/components/onboarding/step-property"
import { StepFloors } from "@/components/onboarding/step-floors"
import { StepTenants } from "@/components/onboarding/step-tenants"
import { StepPreferences } from "@/components/onboarding/step-preferences"
import { StepSummary } from "@/components/onboarding/step-summary"

export function OnboardingWizard({ isDemoMode = false }: { isDemoMode?: boolean }) {
  const { t, language } = useI18n()
  const router = useRouter()
  const syncInvoiceNoteLanguage = useOnboardingStore((s) => s.syncInvoiceNoteLanguage)
  const step = useOnboardingStore((s) => s.step)
  const setStep = useOnboardingStore((s) => s.setStep)
  const propertyName = useOnboardingStore((s) => s.propertyName)
  const pricingModel = useOnboardingStore((s) => s.pricingModel)
  const floorCount = useOnboardingStore((s) => s.floorCount)
  const roomsPerFloor = useOnboardingStore((s) => s.roomsPerFloor)
  const standardBaseRate = useOnboardingStore((s) => s.standardBaseRate)
  const standardWaterMeterStart = useOnboardingStore((s) => s.standardWaterMeterStart)
  const standardElectricMeterStart = useOnboardingStore((s) => s.standardElectricMeterStart)
  const customRooms = useOnboardingStore((s) => s.customRooms)
  const rooms = useMemo(
    () =>
      resolveRooms({
        pricingModel,
        roomsPerFloor,
        standardBaseRate,
        standardWaterMeterStart,
        standardElectricMeterStart,
        customRooms,
      }),
    [
      pricingModel,
      roomsPerFloor,
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
  const invoiceNoteTemplate = useOnboardingStore((s) => s.invoiceNoteTemplate)

  // Keep the note template's default T&Cs in whichever language Step 0
  // picked — but only until the user edits it by hand (see
  // syncInvoiceNoteLanguage in the onboarding store).
  useEffect(() => {
    syncInvoiceNoteLanguage(language)
  }, [language, syncInvoiceNoteLanguage])

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

  function canProceedFromStep2(): boolean {
    if (floorCount < MIN_FLOOR_COUNT || floorCount > MAX_FLOOR_COUNT) return false
    if (roomsPerFloor.length !== floorCount) return false
    if (roomsPerFloor.some((n) => !Number.isFinite(n) || n < 0)) return false
    if (pricingModel === "custom" && customRooms.some((r) => r.floor > floorCount)) return false
    return true
  }

  function handleNext() {
    if (step === 1 && !canProceedFromStep1()) {
      toast.error(t("onboardingIncompleteToast"))
      return
    }
    if (step === 2 && !canProceedFromStep2()) {
      toast.error(t("onboardingIncompleteToast"))
      return
    }
    setStep(Math.min(5, step + 1))
  }

  function handleBack() {
    setStep(Math.max(0, step - 1))
  }

  function handleComplete() {
    // Demo visitors have no account to write to — completeOnboarding would
    // bounce them to /login, so just return them to the demo dashboard.
    if (isDemoMode) {
      router.push("/")
      return
    }
    const roomByDraftId = new Map(rooms.map((r) => [r.id, r]))
    startTransition(async () => {
      const result = await completeOnboarding({
        businessName: propertyName,
        currency,
        waterRate,
        electricRate,
        invoiceNoteTemplate,
        floorCount,
        roomsPerFloor,
        rooms: rooms.map((r) => ({
          roomNumber: r.roomNumber,
          targetPrice: r.targetPrice,
          floor: r.floor,
          waterMeterStart: r.waterMeterStart,
          electricMeterStart: r.electricMeterStart,
        })),
        tenants: tenants.map((tenant) => ({
          roomNumber: roomByDraftId.get(tenant.roomId)?.roomNumber ?? "",
          fullName: tenant.fullName,
          phone: tenant.phone,
          email: tenant.email,
          nationalId: tenant.nationalId,
          leaseStartDate: tenant.leaseStartDate,
          leaseEndDate: tenant.leaseEndDate,
          agreedRent: tenant.agreedRent,
          securityDeposit: tenant.securityDeposit,
          securityDepositStatus: tenant.securityDepositStatus,
        })),
      })
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-x-hidden px-4 py-6 sm:gap-6 sm:py-10">
      {isDemoMode && <DemoPreviewDialog description={t("onboardingDemoDesc")} />}

      {/* Row 1: language toggle + skip */}
      <div className="flex items-center justify-between gap-2">
        <LanguageToggle />
        <form action={skipOnboarding}>
          <Button type="submit" variant="ghost" size="sm" className="min-h-11">
            {t("skipOnboarding")}
          </Button>
        </form>
      </div>

      {/* Row 2: title + subtitle */}
      {step > 0 && (
        <div className="w-full">
          <h1 className="font-heading text-xl font-semibold">{t("onboardingTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("onboardingSubtitle")}</p>
        </div>
      )}

      {/* Row 3: step timeline */}
      {step > 0 && (
        <div className="flex w-full items-center justify-between">
          <StepIndicator current={step} />
        </div>
      )}

      <div className="flex-1">
        {step === 0 && <StepLanguage onContinue={() => setStep(1)} />}
        {step === 1 && <StepProperty />}
        {step === 2 && <StepFloors />}
        {step === 3 && <StepTenants />}
        {step === 4 && <StepPreferences />}
        {step === 5 && <StepSummary onComplete={handleComplete} isPending={isPending} />}
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
          {step < 5 && (
            <Button type="button" onClick={handleNext} className="min-h-11 flex-1 sm:flex-none">
              {t("onboardingNext")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
