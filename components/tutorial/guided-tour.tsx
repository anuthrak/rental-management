"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter } from "next/navigation"

import type { TranslationKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/use-media-query"
import { useI18n } from "@/components/i18n-provider"
import { useGuidedTourStore } from "@/store/use-guided-tour-store"
import { markTourCompleted } from "@/app/actions/tutorial"
import { Button } from "@/components/ui/button"

export const TOUR_COMPLETED_KEY = "rentledger_tour_completed"

interface TourStep {
  id: string
  titleKey: TranslationKey
  bodyKey: TranslationKey
}

const STEPS: TourStep[] = [
  { id: "welcome-hero", titleKey: "tourStep1Title", bodyKey: "tourStep1Body" },
  { id: "room-grid", titleKey: "tourStep2Title", bodyKey: "tourStep2Body" },
  { id: "invoice-generator", titleKey: "tourStep3Title", bodyKey: "tourStep3Body" },
  { id: "payment-tracking", titleKey: "tourStep4Title", bodyKey: "tourStep4Body" },
  { id: "language-toggle", titleKey: "tourStep5Title", bodyKey: "tourStep5Body" },
]

const SPOTLIGHT_PADDING = 8
const CARD_WIDTH = 336
const CARD_MARGIN = 16
// How much clear space above/below the spotlight counts as "room to anchor
// the card there" — below this, targets like the room grid (taller than the
// viewport) fall through to a centered card instead of drifting off-screen.
const ANCHOR_CLEARANCE = 220

interface ClampedRect {
  top: number
  left: number
  width: number
  height: number
}

// Multiple elements can share a data-tour id (desktop header nav vs. mobile
// bottom nav, for the same destination) — pick whichever is actually
// rendered on screen so the spotlight targets what the user can see.
function getVisibleTarget(id: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return null
}

// Clamps the target's rect to the visible viewport. Sections taller than the
// viewport (e.g. the full room grid) would otherwise produce a bounding box
// that extends off-screen in both directions, breaking the card anchoring.
function getClampedRect(el: HTMLElement): ClampedRect | null {
  const r = el.getBoundingClientRect()
  const top = Math.max(r.top, 0)
  const left = Math.max(r.left, 0)
  const bottom = Math.min(r.bottom, window.innerHeight)
  const right = Math.min(r.right, window.innerWidth)
  if (bottom <= top || right <= left) return null
  return { top, left, width: right - left, height: bottom - top }
}

function getAnchoredCardStyle(rect: ClampedRect): React.CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spaceBelow = vh - (rect.top + rect.height)
  const spaceAbove = rect.top

  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - CARD_WIDTH / 2, CARD_MARGIN),
    vw - CARD_WIDTH - CARD_MARGIN,
  )

  let vertical: React.CSSProperties
  if (spaceBelow > ANCHOR_CLEARANCE) {
    vertical = { top: rect.top + rect.height + CARD_MARGIN }
  } else if (spaceAbove > ANCHOR_CLEARANCE) {
    vertical = { bottom: vh - rect.top + CARD_MARGIN }
  } else {
    // Target fills the viewport top-to-bottom — no clear edge to anchor to.
    vertical = { top: "50%", transform: "translateY(-50%)" }
  }

  return { position: "fixed", left, width: CARD_WIDTH, ...vertical }
}

export function GuidedTour({
  isDemoMode,
  initialTourCompleted,
}: {
  isDemoMode: boolean
  initialTourCompleted: boolean
}) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 639px)")

  const isOpen = useGuidedTourStore((s) => s.isOpen)
  const stepIndex = useGuidedTourStore((s) => s.stepIndex)
  const start = useGuidedTourStore((s) => s.start)
  const close = useGuidedTourStore((s) => s.close)
  const next = useGuidedTourStore((s) => s.next)
  const back = useGuidedTourStore((s) => s.back)

  const [mounted, setMounted] = useState(false)
  const [rect, setRect] = useState<ClampedRect | null>(null)

  useEffect(() => setMounted(true), [])

  // Auto-trigger: once right after onboarding (?tour=1, stripped once
  // consumed) and once for guests the first time they land on the dashboard
  // in Demo Mode. Both respect the completed flag so returning users are
  // never interrupted.
  useEffect(() => {
    if (pathname !== "/") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("tour") === "1") {
      start()
      params.delete("tour")
      const qs = params.toString()
      router.replace(qs ? `/?${qs}` : "/", { scroll: false })
      return
    }
    if (initialTourCompleted) return
    if (window.localStorage.getItem(TOUR_COMPLETED_KEY) === "true") return
    if (isDemoMode) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const id = STEPS[stepIndex].id

    function measure() {
      const el = getVisibleTarget(id)
      setRect(el ? getClampedRect(el) : null)
    }

    const target = getVisibleTarget(id)
    target?.scrollIntoView({ block: "center", behavior: "smooth" })
    measure()
    const settleTimer = window.setTimeout(measure, 350)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [isOpen, stepIndex])

  function finish() {
    window.localStorage.setItem(TOUR_COMPLETED_KEY, "true")
    void markTourCompleted()
    close()
  }

  if (!mounted || !isOpen) return null

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const cardBody = (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-lg font-semibold">{t(step.titleKey)}</span>
        <span className="text-sm text-muted-foreground">{t(step.bodyKey)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={finish}
          className="min-h-11 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("tourSkip")}
        </button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={back}>
              {t("tourBack")}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            onClick={() => (isLast ? finish() : next(STEPS.length))}
          >
            {isLast ? t("tourFinish") : t("tourNext")}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      {/* Blocks interaction with the page underneath while the tour is
          active; also serves as the dim backdrop when no target is found. */}
      <div className={cn("fixed inset-0", !rect && "bg-black/70")} onClick={(e) => e.stopPropagation()} />

      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl border-2 border-primary transition-all duration-300 ease-out"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(15,15,15,0.7)",
          }}
        />
      )}

      {isMobile ? (
        <div className="fixed inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-2xl">
          {cardBody}
        </div>
      ) : (
        <div
          className="rounded-xl border border-border bg-card shadow-2xl"
          style={rect ? getAnchoredCardStyle(rect) : { position: "fixed", top: "50%", left: "50%", width: CARD_WIDTH, transform: "translate(-50%, -50%)" }}
        >
          {cardBody}
        </div>
      )}
    </div>,
    document.body,
  )
}
