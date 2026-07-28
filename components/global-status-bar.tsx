import Link from "next/link"
import { LogOut } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { getSession, isDemoMode } from "@/lib/auth/session"
import { logoutAction } from "@/app/login/actions"
import { Button, buttonVariants } from "@/components/ui/button"

export async function GlobalStatusBar() {
  const [demoMode, session] = await Promise.all([isDemoMode(), getSession()])

  if (demoMode) {
    return (
      <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-2 overflow-hidden bg-primary px-3 py-1.5 text-sm text-primary-foreground sm:justify-center sm:gap-3 sm:px-4 sm:py-2">
        <span className="min-w-0 truncate text-xs sm:text-sm">
          <span className="sm:hidden">Viewing Demo Data</span>
          <span className="hidden sm:inline">
            Viewing Demo Data — sign up to keep your own rooms, tenants, and invoices.
          </span>
        </span>
        <Link
          href="/signup"
          className={buttonVariants({ variant: "secondary", size: "sm", className: "min-h-11 shrink-0 sm:min-h-8" })}
        >
          <span className="sm:hidden">Sign Up</span>
          <span className="hidden sm:inline">Create Your Own Account</span>
        </Link>
      </div>
    )
  }

  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, businessName: true },
  })
  if (!user) return null

  return (
    <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-border bg-muted/40 px-3 py-1.5 text-sm sm:gap-3 sm:px-4 sm:py-2">
      <span className="min-w-0 truncate text-muted-foreground">
        {user.businessName ? (
          <>
            <span className="font-medium text-foreground">{user.businessName}</span>
            {" · "}
            {user.email}
          </>
        ) : (
          <span className="font-medium text-foreground">{user.email}</span>
        )}
      </span>
      <form action={logoutAction} className="shrink-0">
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          aria-label="Log Out"
          className="min-h-11 sm:min-h-8"
        >
          <LogOut data-icon="inline-start" />
          <span className="hidden sm:inline">Log Out</span>
        </Button>
      </form>
    </div>
  )
}
