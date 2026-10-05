"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"

export function SimpleModeSection({
  value,
  onChange,
}: {
  value: boolean
  onChange: (value: boolean) => void
}) {
  const { t } = useI18n()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-medium">{t("simpleModeDefaultSectionTitle")}</h2>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-transform active:scale-[0.98]"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">{t("simpleModeDefaultLabel")}</span>
          <span className="text-xs text-muted-foreground">{t("simpleModeDefaultDesc")}</span>
        </span>
        <span
          className={cn(
            "flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            value ? "justify-end bg-primary" : "justify-start bg-muted",
          )}
        >
          <span className="mx-0.5 size-4 rounded-full bg-background shadow" />
        </span>
      </button>
    </section>
  )
}
