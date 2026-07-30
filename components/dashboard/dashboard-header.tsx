"use client"

import { Building2, Receipt, Wallet } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { PageHeader } from "@/components/page-header"

export function DashboardHeader({ banner }: { banner?: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <PageHeader
      icon={Building2}
      title={t("dashboardTitle")}
      tagline={t("dashboardTagline")}
      tutorialPageId="dashboard"
      banner={banner}
      heroTourId="welcome-hero"
      links={[
        { href: "/payments", icon: Wallet, label: t("navPayments"), tourId: "payment-tracking" },
        { href: "/invoice", icon: Receipt, label: t("navInvoiceGenerator"), tourId: "invoice-generator" },
      ]}
    />
  )
}
