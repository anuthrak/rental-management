"use client"

import { useMemo } from "react"

import { computeTotals, withAmounts } from "@/lib/calc"
import { formatCurrency, formatNumber } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"

function formatDate(value: string, locale: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
}

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
      <div className="flex items-start justify-between gap-4 bg-primary p-6 text-primary-foreground">
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
            {formatDate(draft.startDate, locale)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDate(draft.endDate, locale)}
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
          {items.map((item) => (
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
              </div>
              <span className="text-right font-medium tabular-nums">
                {formatCurrency(item.amount, draft.currency, locale)}
              </span>
            </div>
          ))}
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
            <span className="font-heading text-xl font-semibold tabular-nums">
              {formatCurrency(total, draft.currency, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/40 px-6 py-4 text-center text-xs text-muted-foreground">
        {t("thankYou")}
      </div>
    </div>
  )
}
