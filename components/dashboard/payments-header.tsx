"use client"

import { ArrowLeft, Wallet } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { PageHeader } from "@/components/page-header"

export function PaymentsHeader() {
  const { t } = useI18n()
  return (
    <PageHeader
      icon={Wallet}
      title={t("paymentsTitle")}
      tagline={t("paymentsTagline")}
      links={[{ href: "/", icon: ArrowLeft, label: t("navDashboard") }]}
    />
  )
}
