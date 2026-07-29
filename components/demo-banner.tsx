"use client"

import Link from "next/link"

import { useI18n } from "@/components/i18n-provider"
import { buttonVariants } from "@/components/ui/button"

export function DemoBanner() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-11 shrink-0 items-center justify-center gap-3 overflow-hidden bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground sm:px-6">
      <span className="min-w-0 truncate">
        <span className="sm:hidden">{t("demoBannerShort")}</span>
        <span className="hidden sm:inline">{t("demoBannerFull")}</span>
      </span>
      <Link
        href="/onboarding"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className:
            "min-h-11 shrink-0 border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:min-h-8",
        })}
      >
        {t("testOnboardingLabel")}
      </Link>
      <Link
        href="/signup"
        className={buttonVariants({ variant: "secondary", size: "sm", className: "min-h-11 shrink-0 sm:min-h-8" })}
      >
        <span className="sm:hidden">{t("createAccountShort")}</span>
        <span className="hidden sm:inline">{t("createAccountFull")}</span>
      </Link>
    </div>
  )
}
