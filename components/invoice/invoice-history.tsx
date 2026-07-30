"use client"

import { useMemo, useState } from "react"
import { FileText, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { invoiceTotals } from "@/lib/calc"
import { formatCurrency } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function InvoiceHistory({
  onLoad,
}: {
  onLoad?: () => void
}) {
  const { t, locale } = useI18n()
  const savedInvoices = useInvoiceStore((s) => s.savedInvoices)
  const loadInvoice = useInvoiceStore((s) => s.loadInvoice)
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return savedInvoices
    return savedInvoices.filter((inv) =>
      [inv.invoiceNumber, inv.guestName, inv.roomNumber]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [savedInvoices, query])

  if (savedInvoices.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>{t("noHistory")}</EmptyTitle>
          <EmptyDescription>{t("noHistoryDesc")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button className="min-h-11 w-full" onClick={onLoad}>
            {t("generateInvoiceAction")}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchHistory")}
          className="pl-8"
          aria-label={t("searchHistory")}
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((inv) => {
          const { total } = invoiceTotals(inv)
          return (
            <div
              key={inv.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-transform active:scale-[0.99] sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="tabular-nums">
                    {inv.invoiceNumber}
                  </Badge>
                  <span className="truncate font-medium">
                    {inv.guestName || "—"}
                  </span>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {inv.roomNumber ? `${t("roomLabel")} ${inv.roomNumber} · ` : ""}
                  {formatCurrency(total, inv.currency, locale)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 flex-1 sm:flex-none"
                  onClick={() => {
                    loadInvoice(inv.id)
                    onLoad?.()
                    toast.success(`${inv.invoiceNumber} ${t("loadInvoice").toLowerCase()}`)
                  }}
                >
                  {t("loadInvoice")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11"
                  aria-label={`Delete ${inv.invoiceNumber}`}
                  onClick={() => deleteInvoice(inv.id)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noHistory")}
          </p>
        )}
      </div>
    </div>
  )
}
