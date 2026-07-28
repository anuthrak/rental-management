"use client"

import Link from "next/link"
import { Receipt } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { SignupForm } from "@/app/signup/signup-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const { t } = useI18n()
  return (
    <main className="relative mx-auto flex h-full w-full max-w-md flex-col justify-center overflow-y-auto px-4 py-10">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Receipt className="size-5" />
        </span>
        <h1 className="font-heading text-lg font-semibold">RentLedger</h1>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="font-heading">{t("signupPageTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccountText")}{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          {t("authLoginButton")}
        </Link>
      </p>
    </main>
  )
}
