"use client"

import { useState, useTransition } from "react"
import { ArrowLeft, Settings } from "lucide-react"
import { toast } from "sonner"

import type { FloorPlanDimensions } from "@/lib/db/queries"
import type { Currency } from "@/lib/types"
import { updateUserPreferences } from "@/app/actions/onboarding"
import { useI18n } from "@/components/i18n-provider"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { PropertyBusinessSection } from "@/components/settings/property-business-section"
import { UtilityRatesSection } from "@/components/settings/utility-rates-section"
import { InvoiceNoteSection } from "@/components/settings/invoice-note-section"
import { FloorsCapacitySection } from "@/components/settings/floors-capacity-section"
import { SimpleModeSection } from "@/components/settings/simple-mode-section"
import { GuidedTourSection } from "@/components/settings/guided-tour-section"
import { DemoPreviewDialog } from "@/components/demo-preview-dialog"

export function SettingsView({
  banner,
  userId,
  businessName: initialBusinessName,
  currencyPreference,
  defaultWaterRate,
  defaultElectricRate,
  invoiceNoteTemplate: initialInvoiceNoteTemplate,
  floorCount,
  simpleModeDefault: initialSimpleModeDefault,
  floorPlanLayouts,
  roomCountsByFloor,
  readOnly = false,
}: {
  banner?: React.ReactNode
  userId: string | null
  businessName: string
  currencyPreference: Currency
  defaultWaterRate: number
  defaultElectricRate: number
  invoiceNoteTemplate: string
  floorCount: number
  simpleModeDefault: boolean
  floorPlanLayouts: Record<number, FloorPlanDimensions>
  roomCountsByFloor: Record<number, number>
  // Demo mode: no User row to save to, so every control is disabled.
  readOnly?: boolean
}) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()

  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [currency, setCurrency] = useState<Currency>(currencyPreference)
  const [waterRate, setWaterRate] = useState(defaultWaterRate)
  const [electricRate, setElectricRate] = useState(defaultElectricRate)
  const [invoiceNoteTemplate, setInvoiceNoteTemplate] = useState(initialInvoiceNoteTemplate)
  const [simpleModeDefault, setSimpleModeDefault] = useState(initialSimpleModeDefault)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateUserPreferences({
        businessName,
        currency,
        waterRate,
        electricRate,
        invoiceNoteTemplate,
        simpleModeDefault,
      })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(t("settingsSavedToast"))
    })
  }

  return (
    <>
      <PageHeader
        icon={Settings}
        title={t("settingsPageTitle")}
        tagline={t("settingsPageTagline")}
        banner={banner}
        links={[{ href: "/", icon: ArrowLeft, label: t("navDashboard") }]}
      />
      <main className="mx-auto min-h-svh w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
        {readOnly && <DemoPreviewDialog description={t("settingsDemoDesc")} />}
        {/* A disabled fieldset natively disables every input and button inside it. */}
        <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <PropertyBusinessSection
              businessName={businessName}
              onBusinessNameChange={setBusinessName}
              currency={currency}
              onCurrencyChange={setCurrency}
              disabled={readOnly}
            />
            <UtilityRatesSection
              waterRate={waterRate}
              onWaterRateChange={setWaterRate}
              electricRate={electricRate}
              onElectricRateChange={setElectricRate}
            />
            <InvoiceNoteSection
              invoiceNoteTemplate={invoiceNoteTemplate}
              onInvoiceNoteTemplateChange={setInvoiceNoteTemplate}
            />
            <SimpleModeSection value={simpleModeDefault} onChange={setSimpleModeDefault} />
            <Button type="submit" disabled={isPending} className="min-h-11 self-start">
              {t("settingsSaveAction")}
            </Button>
          </form>

          <div className="mt-8 flex flex-col gap-8">
            <FloorsCapacitySection
              userId={userId}
              initialFloorCount={floorCount}
              floorPlanLayouts={floorPlanLayouts}
              roomCountsByFloor={roomCountsByFloor}
            />
            <GuidedTourSection />
          </div>
        </fieldset>
      </main>
    </>
  )
}
