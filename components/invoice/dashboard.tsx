"use client"

import { useRef, useState } from "react"
import { Receipt } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { InvoiceForm } from "@/components/invoice/invoice-form"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { InvoiceHistory } from "@/components/invoice/invoice-history"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard() {
  const { t } = useI18n()
  const hasHydrated = useInvoiceStore((s) => s.hasHydrated)
  const savedCount = useInvoiceStore((s) => s.savedInvoices.length)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [tab, setTab] = useState("preview")

  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Top bar */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Receipt className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">
              {t("appName")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("appTagline")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

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
            {/* Segmented control */}
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

            <div className="relative mt-4">
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
          </div>
        </div>
      )}
    </main>
  )
}
