"use client"

import Link from "next/link"

import { SimpleModeToggle } from "@/components/simple-mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { TutorialButton } from "@/components/dashboard/tutorial-button"
import type { TutorialPageId } from "@/store/use-tutorial-store"

export interface PageHeaderLink {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export function PageHeader({
  icon: Icon,
  title,
  tagline,
  links,
  tutorialPageId,
  banner,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  tagline?: string
  links?: PageHeaderLink[]
  tutorialPageId: TutorialPageId
  banner?: React.ReactNode
}) {
  return (
    <div className="sticky top-0 z-50 flex w-full flex-col gap-2 border-b border-border bg-background/95 pt-0 pb-2 backdrop-blur supports-backdrop-filter:bg-background/80">
      {banner}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-heading text-lg font-semibold">{title}</span>
            {tagline && (
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {tagline}
              </span>
            )}
          </div>
        </div>

        {/* Nav links + toggles are desktop-only: the bottom mobile nav owns
            primary navigation, and the "More" sheet holds these toggles. */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {links?.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
          <SimpleModeToggle />
          <LanguageToggle />
          <ThemeToggle />
          <TutorialButton pageId={tutorialPageId} />
        </div>
      </header>
    </div>
  )
}
