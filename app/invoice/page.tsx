import { getSession } from "@/lib/auth/session"
import { getUserInvoiceNoteTemplateRaw } from "@/lib/db/queries"
import { Dashboard } from "@/components/invoice/dashboard"
import { GlobalStatusBar } from "@/components/global-status-bar"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  const accountNoteTemplate = await getUserInvoiceNoteTemplateRaw(session ? session.userId : null)

  return <Dashboard banner={<GlobalStatusBar />} accountNoteTemplate={accountNoteTemplate} />
}
