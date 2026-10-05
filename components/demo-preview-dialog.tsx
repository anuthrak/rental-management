"use client"

import { useState } from "react"
import Link from "next/link"

import { useI18n } from "@/components/i18n-provider"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"

// Shown once on load when a demo visitor opens a page that would normally
// save to their account (Settings, Onboarding) — explains nothing is saved.
export function DemoPreviewDialog({ description }: { description: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(true)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("demoPreviewTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("close")}</AlertDialogCancel>
          <Link href="/signup" className={buttonVariants()}>
            {t("createAccountShort")}
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
