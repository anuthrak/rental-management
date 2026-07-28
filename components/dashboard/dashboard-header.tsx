"use client"

import { Building2, Receipt, Wallet } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { PageHeader } from "@/components/page-header"

export function DashboardHeader() {
  const { t } = useI18n()
  return (
    <PageHeader
      icon={Building2}
      title={t("dashboardTitle")}
      tagline={t("dashboardTagline")}
      tutorialPageId="dashboard"
      links={[
        { href: "/payments", icon: Wallet, label: t("navPayments") },
        { href: "/invoice", icon: Receipt, label: t("navInvoiceGenerator") },
      ]}
    />
  )
}
