import { getSession } from "@/lib/auth/session"
import { getInvoices } from "@/lib/db/queries"
import { GlobalStatusBar } from "@/components/global-status-bar"
import { PaymentsHeader } from "@/components/dashboard/payments-header"
import { PaymentsView } from "@/components/dashboard/payments-view"

export const dynamic = "force-dynamic"

export default async function PaymentsPage() {
  const session = await getSession()
  const scopeUserId = session ? session.userId : null

  const invoices = await getInvoices(scopeUserId)

  return (
    <>
      <PaymentsHeader banner={<GlobalStatusBar />} />
      <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <PaymentsView invoices={invoices} />
      </main>
    </>
  )
}
