"use client"

import { useActionState } from "react"
import { UserPlus } from "lucide-react"

import { signupAction } from "@/app/signup/actions"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignupForm() {
  const { t } = useI18n()
  const [state, formAction, isPending] = useActionState(signupAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("authNameLabel")}</Label>
        <Input id="name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("authEmailLabel")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("authPasswordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        <UserPlus data-icon="inline-start" />
        {t("authCreateAccountButton")}
      </Button>
    </form>
  )
}
