"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Calculator, DoorOpen, Gauge, History, Share2, TrendingUp, Wallet, Zap } from "lucide-react"

import { useMediaQuery } from "@/lib/use-media-query"
import type { TranslationKey } from "@/lib/i18n"
import { useI18n } from "@/components/i18n-provider"
import { useTutorialStore, type TutorialPageId } from "@/store/use-tutorial-store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const SEEN_KEY_PREFIX = "rentledger-tutorial-seen-"

const PATH_TO_PAGE_ID: Record<string, TutorialPageId> = {
  "/": "dashboard",
  "/invoice": "invoice",
  "/payments": "payments",
}

interface TutorialStep {
  icon: React.ComponentType<{ className?: string }>
  titleKey: TranslationKey
  bodyKey: TranslationKey
}

const STEPS_BY_PAGE: Record<TutorialPageId, TutorialStep[]> = {
  dashboard: [
    { icon: Gauge, titleKey: "dashboardTutorialStep1Title", bodyKey: "dashboardTutorialStep1Body" },
    { icon: DoorOpen, titleKey: "dashboardTutorialStep2Title", bodyKey: "dashboardTutorialStep2Body" },
    { icon: Zap, titleKey: "dashboardTutorialStep3Title", bodyKey: "dashboardTutorialStep3Body" },
  ],
  invoice: [
    { icon: Calculator, titleKey: "invoiceTutorialStep1Title", bodyKey: "invoiceTutorialStep1Body" },
    { icon: Zap, titleKey: "invoiceTutorialStep2Title", bodyKey: "invoiceTutorialStep2Body" },
    { icon: Share2, titleKey: "invoiceTutorialStep3Title", bodyKey: "invoiceTutorialStep3Body" },
  ],
  payments: [
    { icon: Wallet, titleKey: "paymentsTutorialStep1Title", bodyKey: "paymentsTutorialStep1Body" },
    { icon: History, titleKey: "paymentsTutorialStep2Title", bodyKey: "paymentsTutorialStep2Body" },
    { icon: TrendingUp, titleKey: "paymentsTutorialStep3Title", bodyKey: "paymentsTutorialStep3Body" },
  ],
}

export function TutorialSheet() {
  const { t } = useI18n()
  const pathname = usePathname()
  const isDesktop = useMediaQuery("(min-width: 640px)")
  const openPageId = useTutorialStore((s) => s.openPageId)
  const open = useTutorialStore((s) => s.open)
  const close = useTutorialStore((s) => s.close)
  const [step, setStep] = useState(0)

  // Auto-launch each page's tutorial once, the first time it's visited.
  useEffect(() => {
    const pageId = PATH_TO_PAGE_ID[pathname]
    if (!pageId) return
    const seenKey = SEEN_KEY_PREFIX + pageId
    if (window.localStorage.getItem(seenKey)) return
    window.localStorage.setItem(seenKey, "true")
    open(pageId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (openPageId) setStep(0)
  }, [openPageId])

  const steps = openPageId ? STEPS_BY_PAGE[openPageId] : null

  function next() {
    if (!steps) return
    if (step >= steps.length - 1) {
      close()
      return
    }
    setStep((s) => s + 1)
  }

  function back() {
    setStep((s) => Math.max(0, s - 1))
  }

  const current = steps?.[step]
  const Icon = current?.icon

  return (
    <Sheet open={openPageId !== null} onOpenChange={(o) => !o && close()}>
      <SheetContent side={isDesktop ? "center" : "bottom"}>
        {current && Icon && (
          <>
            <SheetHeader>
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <SheetTitle className="mt-2 text-lg">{t(current.titleKey)}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
              <p className="text-sm text-muted-foreground">{t(current.bodyKey)}</p>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {steps!.map((_, i) => (
                    <span
                      key={i}
                      className={`size-1.5 rounded-full ${i === step ? "bg-primary" : "bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="min-h-11 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {t("tutorialSkip")}
                  </button>
                  {step > 0 && (
                    <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={back}>
                      {t("tutorialBack")}
                    </Button>
                  )}
                  <Button type="button" size="sm" className="min-h-11" onClick={next}>
                    {step === steps!.length - 1 ? t("tutorialDone") : t("tutorialNext")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
