import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"

import { getInvoices } from "@/lib/db/queries"
import { PaymentsView } from "@/components/dashboard/payments-view"

export const dynamic = "force-dynamic"

export default async function PaymentsPage() {
  const invoices = await getInvoices()

  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">Payments</span>
            <span className="text-xs text-muted-foreground">All invoices &middot; record payments</span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </header>

      <PaymentsView invoices={invoices} />
    </main>
  )
}
