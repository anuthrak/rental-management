"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, MoreHorizontal, Receipt, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { SimpleModeToggle } from "@/components/simple-mode-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { TutorialButton } from "@/components/dashboard/tutorial-button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

function NavTab({
  href,
  icon: Icon,
  label,
  active,
  dataTour,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  dataTour?: string
}) {
  return (
    <Link
      href={href}
      data-tour={dataTour}
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
        <NavTab
          href="/payments"
          icon={Wallet}
          label={t("navPayments")}
          active={pathname === "/payments"}
          dataTour="payment-tracking"
        />
        <NavTab
          href="/invoice"
          icon={Receipt}
          label={t("navInvoiceShort")}
          active={pathname === "/invoice"}
          dataTour="invoice-handoff"
        />
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
          <div className="flex flex-col gap-3 px-4 pb-6">
            <SimpleModeToggle />
            <LanguageToggle />
            <ThemeToggle />
            <TutorialButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
