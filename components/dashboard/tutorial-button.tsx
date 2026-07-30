"use client"

import { usePathname, useRouter } from "next/navigation"
import { HelpCircle, MapPinned, Sparkles } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { useTutorialStore, type TutorialPageId } from "@/store/use-tutorial-store"
import { useGuidedTourStore } from "@/store/use-guided-tour-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TutorialButton({ pageId }: { pageId: TutorialPageId }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const openTutorial = useTutorialStore((s) => s.open)
  const startTour = useGuidedTourStore((s) => s.start)

  function handleStartTour() {
    if (pathname === "/") {
      startTour()
    } else {
      router.push("/?tour=1")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("tutorialButtonLabel")}
            title={t("tutorialButtonLabel")}
            className="min-h-11 min-w-11"
          >
            <HelpCircle />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => openTutorial(pageId)}>
          <Sparkles />
          {t("pageTutorialLabel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStartTour}>
          <MapPinned />
          {t("takeProductTourLabel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
