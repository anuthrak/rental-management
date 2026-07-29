"use client"

import { useMemo } from "react"

import { computeTotals, USD_TO_KHR_RATE, usdToKhr, withAmounts } from "@/lib/calc"
import { formatCurrency, formatKHR, formatNumber } from "@/lib/currency"
import { formatDateDMY } from "@/lib/date"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"

export function InvoicePreview({
  previewRef,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>
}) {
  const { t, locale } = useI18n()
  const draft = useInvoiceStore((s) => s.draft)
  const items = useMemo(() => withAmounts(draft.lineItems), [draft.lineItems])
  const { subtotal, total } = useMemo(
    () => computeTotals(draft.lineItems),
    [draft.lineItems],
  )

  return (
    <div
      ref={previewRef}
      className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
    >
      {/* Header band */}
      <div className="relative flex items-start justify-between gap-4 bg-primary p-6 pt-16 text-primary-foreground">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-primary-foreground/70">
            {t("invoiceWord")}
          </span>
          <h2 className="font-heading text-xl font-semibold leading-tight text-balance">
            {draft.companyName || t("companyName")}
          </h2>
          {draft.companyAddress && (
            <p className="max-w-[16rem] text-sm text-primary-foreground/80">
              {draft.companyAddress}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-right">
          <span className="font-heading text-lg font-semibold tabular-nums">
            {draft.invoiceNumber || "#0000"}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 border-b border-border p-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("billedTo")}
          </span>
          <span className="font-medium">{draft.guestName || "—"}</span>
          <span className="text-sm text-muted-foreground">
            {t("roomLabel")}: {draft.roomNumber || "—"}
          </span>
          {draft.nationalId && (
            <span className="text-sm text-muted-foreground">
              {t("idLabel")}: {draft.nationalId}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("periodLabel")}
          </span>
          <span className="text-sm">
            {t("dateInField")}: {formatDateDMY(draft.dateIn)}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("dateOutField")}: {formatDateDMY(draft.dateOut)}
          </span>
        </div>
      </div>

      {/* Line items */}
      <div className="flex flex-col p-6">
        <div className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-border pb-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span>{t("label")}</span>
          <span className="text-right">{t("amount")}</span>
        </div>
        <div className="flex flex-col">
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("noLineItems")}
            </p>
          )}
          {items.map((item) => {
            const isUtilityItem = item.unit === "m³" || item.unit === "kW"
            const hasMeterData = item.previousMeter !== undefined && item.recentMeter !== undefined
            const utilityLabel = item.unit === "m³" ? t("waterCostNote") : t("electricCostNote")
            // The Unit enum stores electricity as "kW" everywhere else in
            // the app, but the requested formula wording is "kWh".
            const formulaUnit = item.unit === "kW" ? "kWh" : item.unit
            return (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-border/60 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.label || "—"}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(item.quantity, locale)} {item.unit} ×{" "}
                    {formatCurrency(item.rate, draft.currency, locale)}
                  </span>
                  {isUtilityItem && hasMeterData && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {utilityLabel}: ({formatNumber(item.recentMeter!, locale)} −{" "}
                      {formatNumber(item.previousMeter!, locale)}) {formulaUnit} ×{" "}
                      {formatCurrency(item.rate, draft.currency, locale)}/{formulaUnit} ={" "}
                      {formatCurrency(item.amount, draft.currency, locale)}
                    </span>
                  )}
                </div>
                <span className="text-right font-medium tabular-nums">
                  {formatCurrency(item.amount, draft.currency, locale)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("subtotal")}</span>
            <span className="tabular-nums">
              {formatCurrency(subtotal, draft.currency, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2.5 text-accent-foreground">
            <span className="font-heading font-medium">{t("total")}</span>
            <div className="text-right">
              <div className="font-heading text-xl font-semibold tabular-nums">
                {formatCurrency(total, draft.currency, locale)}
              </div>
              {draft.currency === "USD" && (
                <div className="text-xs font-normal text-accent-foreground/70 tabular-nums">
                  {t("khrEquivalent")} {formatKHR(usdToKhr(total))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Utility & Currency Notes — reference-only, doesn't feed the total */}
      <div className="mx-6 mb-6 flex flex-col gap-1 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">{t("utilityUsage")}</p>
        <p>
          {t("electricCostNote")}: 1 kWh = {formatCurrency(draft.electricRateUsd, "USD", locale)} (
          {formatKHR(usdToKhr(draft.electricRateUsd))})
        </p>
        <p>
          {t("waterCostNote")}: 1 m³ = {formatCurrency(draft.waterRateUsd, "USD", locale)} (
          {formatKHR(usdToKhr(draft.waterRateUsd))})
        </p>
        <p>1 USD = {formatKHR(USD_TO_KHR_RATE)}</p>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4 border-t border-border bg-muted/40 px-6 py-4">
        {draft.notes && (
          <div className="text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">{t("notesLabel")}</p>
            <p className="whitespace-pre-line">{draft.notes}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{t("thankYou")}</p>
          <div className="flex shrink-0 translate-x-10 -translate-y-8 flex-col items-center">
            <span className="text-[14px] text-bold font-large tracking-wide text-muted-foreground uppercase">
              {t("ownerLabel")}
            </span>
            <div className="flex h-24 w-48 items-center justify-center" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/stamp-transparent.png"
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
