"use client"

import { useMemo } from "react"

import { computeTotals } from "@/lib/calc"
import { formatCurrency } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"

export function InvoiceTotals() {
  const { t, locale } = useI18n()
  const lineItems = useInvoiceStore((s) => s.draft.lineItems)
  const currency = useInvoiceStore((s) => s.draft.currency)

  const { subtotal, total } = useMemo(
    () => computeTotals(lineItems),
    [lineItems],
  )

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-primary p-4 text-primary-foreground">
      <div className="flex items-center justify-between text-sm text-primary-foreground/80">
        <span>{t("subtotal")}</span>
        <span className="tabular-nums">
          {formatCurrency(subtotal, currency, locale)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-heading text-sm font-medium">{t("total")}</span>
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {formatCurrency(total, currency, locale)}
        </span>
      </div>
    </div>
  )
}
