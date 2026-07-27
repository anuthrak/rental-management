"use client"

import { useMemo, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

import type { DashboardInvoice } from "@/lib/db/queries"
import { formatCurrency } from "@/lib/currency"
import { markInvoicePaid } from "@/app/dashboard/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FilterTab = "all" | "unpaid" | "overdue" | "paid"

function statusLabel(invoice: DashboardInvoice) {
  if (invoice.status === "PAID") return "Paid"
  return invoice.isOverdue ? "Overdue" : "Unpaid"
}

function statusVariant(invoice: DashboardInvoice) {
  if (invoice.status === "PAID") return "secondary" as const
  return invoice.isOverdue ? ("destructive" as const) : ("outline" as const)
}

export function PaymentsView({ invoices }: { invoices: DashboardInvoice[] }) {
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

  function handleMarkPaid(invoiceId: string) {
    setPendingId(invoiceId)
    startTransition(async () => {
      await markInvoicePaid(invoiceId)
      toast.success("Invoice marked as paid")
      setPendingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search room or tenant..."
            className="pl-8"
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          {filtered.map((invoice) => (
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
                {invoice.status !== "PAID" && (
                  <Button
                    size="sm"
                    disabled={isPending && pendingId === invoice.id}
                    onClick={() => handleMarkPaid(invoice.id)}
                  >
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No invoices match your search.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
