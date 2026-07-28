"use client"

import { HelpCircle } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { useTutorialStore, type TutorialPageId } from "@/store/use-tutorial-store"
import { Button } from "@/components/ui/button"

export function TutorialButton({ pageId }: { pageId: TutorialPageId }) {
  const { t } = useI18n()
  const open = useTutorialStore((s) => s.open)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("tutorialButtonLabel")}
      title={t("tutorialButtonLabel")}
      onClick={() => open(pageId)}
      className="min-h-11 min-w-11"
    >
      <HelpCircle />
    </Button>
  )
}
