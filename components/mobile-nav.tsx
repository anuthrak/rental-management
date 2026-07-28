"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, MoreHorizontal, Receipt, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { MoreSheetContent } from "@/components/dashboard/more-sheet"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { TutorialPageId } from "@/store/use-tutorial-store"

const PATH_TO_PAGE_ID: Record<string, TutorialPageId> = {
  "/": "dashboard",
  "/invoice": "invoice",
  "/payments": "payments",
}

function NavTab({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition-transform active:scale-95",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function MobileNav() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Auth/onboarding routes render their own full-page flow — no app shell there.
  if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding") {
    return null
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 flex items-stretch gap-1 border-t border-border bg-card px-2 pt-1 sm:hidden"
        style={{
          height: "var(--bottom-nav-height)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <NavTab href="/" icon={Building2} label={t("navDashboard")} active={pathname === "/"} />
        <NavTab href="/payments" icon={Wallet} label={t("navPayments")} active={pathname === "/payments"} />
        <NavTab href="/invoice" icon={Receipt} label={t("navInvoiceShort")} active={pathname === "/invoice"} />
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] font-medium text-muted-foreground transition-transform active:scale-95"
        >
          <MoreHorizontal className="size-5" />
          <span className="truncate">{t("navMore")}</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="sm:hidden">
          <SheetHeader>
            <SheetTitle>{t("moreSheetTitle")}</SheetTitle>
          </SheetHeader>
          <MoreSheetContent pageId={PATH_TO_PAGE_ID[pathname] ?? null} onClose={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
