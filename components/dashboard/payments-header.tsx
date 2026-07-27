"use client"

import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { SimpleModeToggle } from "@/components/simple-mode-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { TutorialButton } from "@/components/dashboard/tutorial-button"

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
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("navDashboard")}
        </Link>
        <SimpleModeToggle />
        <LanguageToggle />
        <ThemeToggle />
        <TutorialButton />
      </div>
    </header>
  )
}
