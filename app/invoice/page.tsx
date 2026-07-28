import { Dashboard } from "@/components/invoice/dashboard"
import { GlobalStatusBar } from "@/components/global-status-bar"

export default function Page() {
  return <Dashboard banner={<GlobalStatusBar />} />
}
