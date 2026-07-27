"use client"

import { Check } from "lucide-react"

import { LANGUAGES, type Language } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { Button } from "@/components/ui/button"

const LANGUAGE_CARD: Record<Language, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  km: { flag: "🇰🇭", label: "ភាសាខ្មែរ" },
}

export function StepLanguage({ onContinue }: { onContinue: () => void }) {
  const { t } = useI18n()
  const language = useInvoiceStore((s) => s.draft.language)
  const updateDraft = useInvoiceStore((s) => s.updateDraft)

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col items-center justify-center gap-8 py-6 sm:min-h-0 sm:py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-semibold text-balance">
          {t("chooseLanguageTitle")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("chooseLanguageDesc")}</p>
      </div>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        {LANGUAGES.map((lng) => {
          const isSelected = language === lng
          const card = LANGUAGE_CARD[lng]
          return (
            <button
              key={lng}
              type="button"
              aria-pressed={isSelected}
              onClick={() => updateDraft({ language: lng })}
              className={cn(
                "relative flex min-h-11 flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-colors",
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
              )}
              <span className="text-5xl" aria-hidden>
                {card.flag}
              </span>
              <span className="font-heading text-lg font-medium">{card.label}</span>
            </button>
          )
        })}
      </div>

      <Button
        type="button"
        onClick={onContinue}
        className="min-h-11 w-full max-w-md px-8 text-base"
      >
        {t("continueAction")}
      </Button>
    </div>
  )
}
