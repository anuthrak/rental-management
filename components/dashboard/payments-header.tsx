"use client"

import Link from "next/link"
import { ArrowLeft, LogOut, Wallet } from "lucide-react"

import { logoutAction } from "@/app/login/actions"
import { useI18n } from "@/components/i18n-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export function PaymentsHeader() {
  const { t } = useI18n()
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-lg font-semibold">{t("paymentsTitle")}</span>
          <span className="text-xs text-muted-foreground">{t("paymentsTagline")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("navDashboard")}
        </Link>
        <LanguageToggle />
        <ThemeToggle />
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  )
}
