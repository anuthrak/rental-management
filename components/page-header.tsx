"use client"

import Link from "next/link"

import { SimpleModeToggle } from "@/components/simple-mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { TutorialButton } from "@/components/dashboard/tutorial-button"

export interface PageHeaderLink {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  dataTour?: string
}

export function PageHeader({
  icon: Icon,
  title,
  tagline,
  links,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  tagline?: string
  links?: PageHeaderLink[]
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 lg:mb-8">
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
            data-tour={link.dataTour}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        ))}
        <SimpleModeToggle />
        <LanguageToggle />
        <ThemeToggle />
        <TutorialButton />
      </div>
    </header>
  )
}
