"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = [
  { number: 1, label: "Property" },
  { number: 2, label: "Tenants" },
  { number: 3, label: "Preferences" },
  { number: 4, label: "Review" },
]

export function StepIndicator({ current }: { current: number }) {
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
                {step.label}
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
