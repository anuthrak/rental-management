"use client"

import { HelpCircle } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { useTourStore } from "@/store/use-tour-store"
import { Button } from "@/components/ui/button"

export function TutorialButton() {
  const router = useRouter()
  const pathname = usePathname()
  const openTour = useTourStore((s) => s.open)

  function handleClick() {
    // The tour's highlighted elements only exist on the dashboard (now the
    // root route), so from any other page (Payments, Invoice Generator)
    // navigate there first and let DashboardTour pick up the ?tour=1 flag
    // to auto-launch.
    if (pathname === "/") {
      openTour()
    } else {
      router.push("/?tour=1")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Tutorial / Help"
      title="Tutorial / Help"
      onClick={handleClick}
      className="min-h-11 min-w-11"
    >
      <HelpCircle />
    </Button>
  )
}
