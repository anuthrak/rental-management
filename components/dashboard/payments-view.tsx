"use client"

import { useMemo, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

import type { DashboardInvoice } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { useI18n } from "@/components/i18n-provider"
import { setInvoiceStatus } from "@/app/dashboard/actions"
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
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<FilterTab>("all")
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((invoice) => {
      if (tab === "unpaid" && (invoice.status !== "UNPAID" || invoice.isOverdue)) return false
      if (tab === "overdue" && !invoice.isOverdue) return false
      if (tab === "paid" && invoice.status !== "PAID") return false
      if (!q) return true
      return (
        invoice.roomNumber.toLowerCase().includes(q) ||
        invoice.tenantName.toLowerCase().includes(q)
      )
    })
  }, [invoices, query, tab])

  function handleToggleStatus(invoiceId: string, isPaid: boolean) {
    setPendingId(invoiceId)
    startTransition(async () => {
      await setInvoiceStatus(invoiceId, isPaid ? "UNPAID" : "PAID")
      toast.success(isPaid ? t("invoiceMarkedUnpaidToast") : t("invoiceMarkedPaidToast"))
      setPendingId(null)
    })
  }

  function statusLabel(invoice: DashboardInvoice) {
    if (invoice.status === "PAID") return t("paidStatus")
    return invoice.isOverdue ? t("overdueStatus") : t("unpaidStatus")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchRoomTenant")}
            className="pl-8"
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">{t("tabAll")}</TabsTrigger>
            <TabsTrigger value="unpaid">{t("tabUnpaid")}</TabsTrigger>
            <TabsTrigger value="overdue">{t("tabOverdue")}</TabsTrigger>
            <TabsTrigger value="paid">{t("tabPaid")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          {filtered.map((invoice) => {
            const isPaid = invoice.status === "PAID"
            return (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {invoice.roomNumber} &middot; {invoice.tenantName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">
                    {formatCurrency(invoice.amountDue, "USD")}
                  </span>
                  <Badge variant={statusVariant(invoice)}>{statusLabel(invoice)}</Badge>
                  <Button
                    size="sm"
                    variant={isPaid ? "outline" : "default"}
                    disabled={isPending && pendingId === invoice.id}
                    onClick={() => handleToggleStatus(invoice.id, isPaid)}
                  >
                    {isPaid ? t("markUnpaidAction") : t("recordPaymentAction")}
                  </Button>
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
