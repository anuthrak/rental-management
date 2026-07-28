"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Search, Share2 } from "lucide-react"
import { toast } from "sonner"

import type { DashboardInvoice } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { formatDateDMY } from "@/lib/date"
import { shareInvoiceSummary } from "@/lib/share"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { setInvoiceStatus } from "@/app/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FilterTab = "all" | "unpaid" | "overdue" | "paid"

function statusVariant(invoice: DashboardInvoice) {
  if (invoice.status === "PAID") return "secondary" as const
  return invoice.isOverdue ? ("destructive" as const) : ("outline" as const)
}

export function PaymentsView({ invoices }: { invoices: DashboardInvoice[] }) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<FilterTab>(simpleMode ? "unpaid" : "all")
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Jump to the actionable filter when Simple Mode is (de)activated.
  useEffect(() => {
    setTab(simpleMode ? "unpaid" : "all")
  }, [simpleMode])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((invoice) => {
      if (simpleMode) {
        if (showOnlyUnpaid && invoice.status === "PAID") return false
      } else {
        if (tab === "unpaid" && (invoice.status !== "UNPAID" || invoice.isOverdue)) return false
        if (tab === "overdue" && !invoice.isOverdue) return false
        if (tab === "paid" && invoice.status !== "PAID") return false
      }
      if (!q) return true
      return (
        invoice.roomNumber.toLowerCase().includes(q) ||
        invoice.tenantName.toLowerCase().includes(q)
      )
    })
  }, [invoices, query, tab, simpleMode, showOnlyUnpaid])

  function handleToggleStatus(invoiceId: string, isPaid: boolean) {
    setPendingId(invoiceId)
    startTransition(async () => {
      await setInvoiceStatus(invoiceId, isPaid ? "UNPAID" : "PAID")
      toast.success(isPaid ? t("invoiceMarkedUnpaidToast") : t("invoiceMarkedPaidToast"))
      setPendingId(null)
    })
  }

  async function handleShare(invoice: DashboardInvoice) {
    const dueLabel = `${t("dueLabel")} ${formatDateDMY(invoice.dueDate)}`
    const result = await shareInvoiceSummary({
      roomNumber: invoice.roomNumber,
      tenantName: invoice.tenantName,
      phone: invoice.tenantPhone,
      amountLabel: formatCurrency(invoice.amountDue, "USD"),
      dueLabel,
    })
    if (result === "copied") toast.success(t("shareCopiedToast"))
  }

  function statusLabel(invoice: DashboardInvoice) {
    if (invoice.status === "PAID") return t("paidStatus")
    return invoice.isOverdue ? t("overdueStatus") : t("unpaidStatus")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!simpleMode && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchRoomTenant")}
              className="pl-8"
            />
          </div>
        )}
        {simpleMode ? (
          <button
            type="button"
            role="switch"
            aria-checked={showOnlyUnpaid}
            onClick={() => setShowOnlyUnpaid((v) => !v)}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium"
          >
            <span
              className={`flex h-5 w-9 items-center rounded-full transition-colors ${showOnlyUnpaid ? "bg-primary justify-end" : "bg-muted justify-start"}`}
            >
              <span className="mx-0.5 size-4 rounded-full bg-background shadow" />
            </span>
            {t("showOnlyUnpaidLabel")}
          </button>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
            <TabsList>
              <TabsTrigger value="all">{t("tabAll")}</TabsTrigger>
              <TabsTrigger value="unpaid">{t("tabUnpaid")}</TabsTrigger>
              <TabsTrigger value="overdue">{t("tabOverdue")}</TabsTrigger>
              <TabsTrigger value="paid">{t("tabPaid")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          {filtered.map((invoice) => {
            const isPaid = invoice.status === "PAID"
            return (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 text-sm transition-transform active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {invoice.roomNumber} &middot; {invoice.tenantName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Due {formatDateDMY(invoice.dueDate)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <span className="font-medium tabular-nums">
                      {formatCurrency(invoice.amountDue, "USD")}
                    </span>
                    <Badge variant={statusVariant(invoice)}>{statusLabel(invoice)}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {!isPaid && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-11 flex-1 sm:flex-none"
                        onClick={() => handleShare(invoice)}
                      >
                        <Share2 data-icon="inline-start" />
                        {t("shareInvoiceAction")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isPaid ? "outline" : "default"}
                      className="min-h-11 flex-1 sm:flex-none"
                      disabled={isPending && pendingId === invoice.id}
                      onClick={() => handleToggleStatus(invoice.id, isPaid)}
                    >
                      {isPaid ? t("markUnpaidAction") : t("recordPaymentAction")}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("noInvoicesMatch")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
