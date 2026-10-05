"use client"

import { Check } from "lucide-react"

import type { TranslationKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"

const STEPS: { number: number; labelKey: TranslationKey }[] = [
  { number: 1, labelKey: "propertyStepLabel" },
  { number: 2, labelKey: "floorsStepLabel" },
  { number: 3, labelKey: "tenantsStepLabel" },
  { number: 4, labelKey: "preferencesStepLabel" },
  { number: 5, labelKey: "reviewStepLabel" },
]

export function StepIndicator({ current }: { current: number }) {
  const { t } = useI18n()
  return (
    <ol className="flex w-full items-center">
      {STEPS.map((step, index) => {
        const isComplete = current > step.number
        const isCurrent = current === step.number
        return (
          <li key={step.number} className="flex flex-1 items-center last:flex-none">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors sm:size-8 sm:text-sm",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete && !isCurrent && "border-border text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-3.5 sm:size-4" /> : step.number}
              </span>
              <span
                className={cn(
                  "max-w-full px-0.5 text-center text-[10px] leading-tight font-medium sm:text-xs",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-1 mb-4 h-px flex-1 sm:mx-2 sm:mb-5",
                  isComplete ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
