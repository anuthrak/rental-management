"use client"

import { useState, useTransition } from "react"
import { LogOut } from "lucide-react"

import { logoutAction } from "@/app/login/actions"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function LogoutButton() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Log Out"
        className="min-h-11 shrink-0 sm:min-h-8"
        onClick={() => setOpen(true)}
      >
        <LogOut data-icon="inline-start" />
        <span className="hidden sm:inline">Log Out</span>
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("logoutConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("logoutConfirmDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleLogout}>
            {t("confirmLogoutAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
