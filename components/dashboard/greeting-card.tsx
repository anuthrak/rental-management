"use client"

import { useI18n } from "@/components/i18n-provider"

export function GreetingCard({ name }: { name: string }) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:hidden">
      <p className="font-heading text-lg font-semibold text-foreground">
        {t("greetingPrefix")} {name}!
      </p>
    </div>
  )
}
