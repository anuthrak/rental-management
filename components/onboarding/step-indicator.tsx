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
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete && !isCurrent && "border-border text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-4" /> : step.number}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2 mb-5 h-px flex-1",
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
