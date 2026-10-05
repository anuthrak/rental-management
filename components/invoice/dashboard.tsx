"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Building2, Receipt } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { ELECTRIC_RATE_USD } from "@/lib/calc"
import { PageHeader } from "@/components/page-header"
import { InvoiceForm } from "@/components/invoice/invoice-form"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { InvoiceHistory } from "@/components/invoice/invoice-history"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard({
  banner,
  accountNoteTemplate,
  accountWaterRate,
  accountElectricRate,
}: {
  banner?: React.ReactNode
  // The signed-in account's saved invoice note template (null in demo mode
  // or if the account hasn't saved one) — fetched server-side in
  // app/invoice/page.tsx and applied post-hydration below.
  accountNoteTemplate?: string | null
  // The signed-in account's saved utility rates (see getUserUtilityRates) —
  // fetched server-side in app/invoice/page.tsx. Undefined in demo mode.
  accountWaterRate?: number
  accountElectricRate?: number
}) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const hasHydrated = useInvoiceStore((s) => s.hasHydrated)
  const savedCount = useInvoiceStore((s) => s.savedInvoices.length)
  const applyAccountNoteTemplate = useInvoiceStore((s) => s.applyAccountNoteTemplate)
  const applyAccountRates = useInvoiceStore((s) => s.applyAccountRates)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [tab, setTab] = useState("preview")

  // Runs on every mount, but applyAccountNoteTemplate/applyAccountRates only
  // ever overwrite fields that still match a built-in stock default — so
  // this can't clobber text/rates the user actually edited into a draft.
  useEffect(() => {
    if (!hasHydrated) return
    if (accountNoteTemplate) applyAccountNoteTemplate(accountNoteTemplate)
    if (accountWaterRate !== undefined) {
      applyAccountRates(accountWaterRate, accountElectricRate ?? ELECTRIC_RATE_USD)
    }
  }, [
    hasHydrated,
    accountNoteTemplate,
    accountWaterRate,
    accountElectricRate,
    applyAccountNoteTemplate,
    applyAccountRates,
  ])

  return (
    <>
      <PageHeader
        icon={Receipt}
        title={t("appName")}
        tagline={t("appTagline")}
        tutorialPageId="invoice"
        banner={banner}
        links={[{ href: "/", icon: ArrowLeft, label: t("navDashboard") }]}
      />
      <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">

      {!hasHydrated ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Skeleton className="h-[32rem] w-full rounded-xl" />
          <Skeleton className="h-[32rem] w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left: form */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="font-heading">
                {t("invoiceDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceForm previewRef={previewRef} />
            </CardContent>
          </Card>

          {/* Right: preview + history */}
          <div className="lg:sticky lg:top-6">
            {simpleMode ? (
              tab === "history" && (
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {t("backToPreviewLabel")}
                </button>
              )
            ) : (
              /* Segmented control */
              <div
                role="tablist"
                aria-label={t("preview") + " / " + t("history")}
                className="flex w-full items-center gap-1 rounded-lg bg-muted p-1"
              >
                {(
                  [
                    { key: "preview", label: t("preview") },
                    {
                      key: "history",
                      label:
                        t("history") + (savedCount > 0 ? ` (${savedCount})` : ""),
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    role="tab"
                    type="button"
                    aria-selected={tab === item.key}
                    onClick={() => setTab(item.key)}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      tab === item.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className={cn("relative", !simpleMode && "mt-4")}>
              {/* Preview stays mounted (moved off-screen when hidden) so it
                  can always be exported/shared from the form actions. */}
              <div
                className={cn(
                  tab !== "preview" && "absolute top-0 left-[-9999px] w-full",
                )}
                aria-hidden={tab !== "preview"}
              >
                <InvoicePreview previewRef={previewRef} />
              </div>
              {tab === "history" && (
                <InvoiceHistory onLoad={() => setTab("preview")} />
              )}
            </div>

            {simpleMode && tab === "preview" && savedCount > 0 && (
              <button
                type="button"
                onClick={() => setTab("history")}
                className="mt-3 min-h-11 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t("viewSavedInvoicesLabel")} ({savedCount})
              </button>
            )}
          </div>
        </div>
      )}
      </main>
    </>
  )
}
