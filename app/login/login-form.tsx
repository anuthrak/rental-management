"use client"

import { useActionState } from "react"
import { LogIn, Sparkles } from "lucide-react"

import { loginAction, startDemoAction } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined)

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          <LogIn data-icon="inline-start" />
          Log in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={startDemoAction}>
        <Button type="submit" variant="outline" className="w-full">
          <Sparkles data-icon="inline-start" />
          Try Demo / Guest Mode
        </Button>
      </form>
    </div>
  )
}
