"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { ChevronRight, HelpCircle, Languages, Moon, Sparkles, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/lib/types"
import { useI18n } from "@/components/i18n-provider"
import { useInvoiceStore } from "@/store/use-invoice-store"
import { useSimpleModeStore } from "@/store/use-simple-mode-store"
import { useTutorialStore, type TutorialPageId } from "@/store/use-tutorial-store"

const LANGUAGE_DISPLAY: Record<string, string> = { km: "KH" }

function SettingRow({
  icon: Icon,
  title,
  description,
  control,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  control: React.ReactNode
  onClick?: () => void
}) {
  const Wrapper = onClick ? "button" : "div"
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-transform",
        onClick && "active:scale-[0.98]",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <span className="shrink-0">{control}</span>
    </Wrapper>
  )
}

function Switch({ checked }: { checked: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      className={cn(
        "flex h-5 w-9 items-center rounded-full transition-colors",
        checked ? "justify-end bg-primary" : "justify-start bg-muted",
      )}
    >
      <span className="mx-0.5 size-4 rounded-full bg-background shadow" />
    </span>
  )
}

export function MoreSheetContent({
  pageId,
  onClose,
}: {
  pageId: TutorialPageId | null
  onClose: () => void
}) {
  const { t } = useI18n()
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)
  const toggleSimpleMode = useSimpleModeStore((s) => s.toggle)
  const language = useInvoiceStore((s) => s.draft.language)
  const updateDraft = useInvoiceStore((s) => s.updateDraft)
  const openTutorial = useTutorialStore((s) => s.open)

  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      <SettingRow
        icon={Sparkles}
        title={t("simpleModeLabel")}
        description={t("simpleModeSettingDesc")}
        control={<Switch checked={simpleMode} />}
        onClick={toggleSimpleMode}
      />

      <SettingRow
        icon={isDark ? Moon : Sun}
        title={t("themeSettingTitle")}
        description={t("themeSettingDesc")}
        control={<Switch checked={isDark} />}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      />

      <SettingRow
        icon={Languages}
        title={t("languageSettingTitle")}
        description={t("languageSettingDesc")}
        control={
          <span className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            {LANGUAGES.map((lng) => (
              <button
                key={lng}
                type="button"
                aria-pressed={language === lng}
                onClick={() => updateDraft({ language: lng })}
                className={cn(
                  "min-h-9 rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors",
                  language === lng
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {LANGUAGE_DISPLAY[lng] ?? lng}
              </button>
            ))}
          </span>
        }
      />

      {pageId && (
        <SettingRow
          icon={HelpCircle}
          title={t("helpSettingTitle")}
          description={t("helpSettingDesc")}
          control={<ChevronRight className="size-4 text-muted-foreground" />}
          onClick={() => {
            openTutorial(pageId)
            onClose()
          }}
        />
      )}
    </div>
  )
}
