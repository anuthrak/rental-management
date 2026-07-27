"use client"

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"

export function SimpleModeToggle() {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const toggle = useSimpleModeStore((s) => s.toggle)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={simpleMode}
      onClick={toggle}
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-medium transition-colors",
        simpleMode
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <Sparkles className="size-4" aria-hidden />
      <span className="hidden sm:inline">
        {simpleMode ? t("advancedModeLabel") : t("simpleModeLabel")}
      </span>
    </button>
  )
}
