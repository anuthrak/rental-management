import Link from "next/link"

import { prisma } from "@/lib/prisma"
import { getSession, isDemoMode } from "@/lib/auth/session"
import { LogoutButton } from "@/components/logout-button"
import { buttonVariants } from "@/components/ui/button"

function capitalizeEmailPrefix(email: string): string {
  const prefix = email.split("@")[0] || email
  const firstSegment = prefix.split(/[._+-]/)[0] || prefix
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
}

export async function GlobalStatusBar() {
  const [demoMode, session] = await Promise.all([isDemoMode(), getSession()])

  if (demoMode) {
    return (
      <div className="sticky top-0 z-50 flex min-h-11 shrink-0 items-center justify-center gap-3 overflow-hidden bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
        <span className="min-w-0 truncate">
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
    select: { email: true, name: true, businessName: true },
  })
  if (!user) return null

  const displayName = user.name?.trim() || capitalizeEmailPrefix(user.email)

  return (
    <div className="sticky top-0 z-50 flex min-h-11 shrink-0 items-center justify-center gap-3 overflow-hidden border-b border-border bg-background/95 px-3 py-2 text-center text-sm font-medium backdrop-blur supports-backdrop-filter:bg-background/80">
      <span className="min-w-0 truncate text-muted-foreground">
        {user.businessName ? (
          <>
            <span className="font-medium text-foreground">{user.businessName}</span>
            {" · "}
            {displayName}
          </>
        ) : (
          <span className="font-medium text-foreground">{displayName}</span>
        )}
      </span>
      <LogoutButton />
    </div>
  )
}
