import Link from "next/link"
import { Receipt } from "lucide-react"

import { LoginForm } from "@/app/login/login-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Receipt className="size-5" />
        </span>
        <h1 className="font-heading text-lg font-semibold">RentLedger</h1>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="font-heading">Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </main>
  )
}
