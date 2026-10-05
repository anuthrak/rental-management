"use client"

import { replayGuidedTour } from "@/app/actions/settings"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"

export function GuidedTourSection() {
  const { t } = useI18n()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-medium">{t("guidedTourSectionTitle")}</h2>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">{t("replayGuidedTourDesc")}</p>
        <form action={replayGuidedTour}>
          <Button type="submit" variant="outline" className="min-h-11">
            {t("replayGuidedTourAction")}
          </Button>
        </form>
      </div>
    </section>
  )
}
