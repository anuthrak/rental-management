"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useTourStore } from "@/store/use-tour-store"

const TOUR_SEEN_KEY = "rentledger-tour-seen"

const STEPS = [
  {
    selector: '[data-tour="room-grid"]',
    title: "1. Room Grid & Status",
    body: "Every room lives here — vacant, occupied, or under maintenance. Click a room to manage its tenant, lease, and meter readings.",
  },
  {
    selector: '[data-tour="invoice-handoff"]',
    title: "2. Quick Invoice Handoff",
    body: "Jump into the invoice generator to bill a tenant and hand them a polished invoice in seconds.",
  },
  {
    selector: '[data-tour="payment-tracking"]',
    title: "3. Payment Tracking",
    body: "See who's paid, who's overdue, and mark invoices as paid — all from the Payments tab.",
  },
] as const

type Rect = { top: number; left: number; width: number; height: number }

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export function DashboardTour() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = useTourStore((s) => s.active)
  const openTour = useTourStore((s) => s.open)
  const closeTour = useTourStore((s) => s.close)

  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // First-time visitors: auto-launch once, gated on a localStorage flag.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.localStorage.getItem(TOUR_SEEN_KEY)) return
    openTour()
  }, [openTour])

  // The header's Tutorial button links here with ?tour=1 to re-launch the
  // tour on demand, including from pages other than the dashboard (root).
  useEffect(() => {
    if (searchParams.get("tour") !== "1") return
    openTour()
    router.replace("/")
  }, [searchParams, openTour, router])

  // Every time the tour (re)opens, start from the first step.
  useEffect(() => {
    if (active) setStep(0)
  }, [active])

  useEffect(() => {
    if (!active) return

    function reposition() {
      setRect(measure(STEPS[step].selector))
    }

    const target = document.querySelector(STEPS[step].selector)
    target?.scrollIntoView({ behavior: "smooth", block: "center" })
    // Let the scroll settle before measuring so the highlight lands correctly.
    const timeout = window.setTimeout(reposition, 300)

    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
    }
  }, [active, step])

  useLayoutEffect(() => {
    if (!rect || !cardRef.current) return
    const card = cardRef.current.getBoundingClientRect()
    const margin = 12
    const spaceBelow = window.innerHeight - rect.top - rect.height
    const top =
      spaceBelow > card.height + margin
        ? rect.top + rect.height + margin
        : Math.max(margin, rect.top - card.height - margin)
    const left = Math.min(
      Math.max(margin, rect.left),
      window.innerWidth - card.width - margin,
    )
    setCardPos({ top, left })
  }, [rect])

  function finish() {
    window.localStorage.setItem(TOUR_SEEN_KEY, "true")
    closeTour()
  }

  function next() {
    if (step >= STEPS.length - 1) {
      finish()
      return
    }
    setStep((s) => s + 1)
  }

  if (!active) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Dashboard tour">
      <div className="absolute inset-0 bg-background/70 transition-opacity" />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}
      <div
        ref={cardRef}
        className="absolute w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg transition-all duration-300"
        style={{ top: cardPos.top, left: cardPos.left }}
      >
        <p className="font-heading text-sm font-semibold">{current.title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.selector}
                className={`size-1.5 rounded-full ${i === step ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={finish}
              className="min-h-11 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={next}
              className="min-h-11 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {step === STEPS.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
