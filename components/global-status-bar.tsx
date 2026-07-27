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
      <div className="sticky top-0 z-50 flex shrink-0 flex-wrap items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
        <span>Viewing Demo Data — sign up to keep your own rooms, tenants, and invoices.</span>
        <Link href="/signup" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Create Your Own Account
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
    <div className="sticky top-0 z-50 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2 text-sm">
      <span className="text-muted-foreground">
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
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut data-icon="inline-start" />
          Log Out
        </Button>
      </form>
    </div>
  )
}
