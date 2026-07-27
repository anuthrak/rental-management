"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"

// In normal mode, renders children as-is. In Simple Mode, tucks children
// behind a collapsed "Show More Details" disclosure so non-technical users
// aren't confronted with fields like custom pricing, deposit status, or
// meter-reading math — while keeping them one tap away.
export function AdvancedSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const [open, setOpen] = useState(false)

  if (!simpleMode) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        {open ? t("hideAdvancedLabel") : t("showAdvancedLabel")}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}
