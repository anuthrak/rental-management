"use client"

import { Languages } from "lucide-react"

import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/lib/types"
import { useInvoiceStore } from "@/store/use-invoice-store"

export function LanguageToggle() {
  const language = useInvoiceStore((s) => s.draft.language)
  const updateDraft = useInvoiceStore((s) => s.updateDraft)

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Languages className="ml-1 size-4 text-muted-foreground" aria-hidden />
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          aria-pressed={language === lng}
          onClick={() => updateDraft({ language: lng })}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors",
            language === lng
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {lng}
        </button>
      ))}
    </div>
  )
}
