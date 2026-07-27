import Link from "next/link"
import { Receipt } from "lucide-react"

import { SignupForm } from "@/app/signup/signup-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
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
          <CardTitle className="font-heading">Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </main>
  )
}
