import { getSession } from "@/lib/auth/session"
import { getUserInvoiceNoteTemplateRaw, getUserUtilityRates } from "@/lib/db/queries"
import { Dashboard } from "@/components/invoice/dashboard"
import { GlobalStatusBar } from "@/components/global-status-bar"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  const scopeUserId = session ? session.userId : null
  const [accountNoteTemplate, { waterRateUsd, electricRateUsd }] = await Promise.all([
    getUserInvoiceNoteTemplateRaw(scopeUserId),
    getUserUtilityRates(scopeUserId),
  ])

  return (
    <Dashboard
      banner={<GlobalStatusBar />}
      accountNoteTemplate={accountNoteTemplate}
      accountWaterRate={waterRateUsd}
      accountElectricRate={electricRateUsd}
    />
  )
}
