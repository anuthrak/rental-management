import { prisma } from "@/lib/prisma"
import { getSession, isDemoMode } from "@/lib/auth/session"
import { getDisplayName } from "@/lib/user-display-name"
import { DemoBanner } from "@/components/demo-banner"
import { LogoutButton } from "@/components/logout-button"

export async function GlobalStatusBar() {
  const [demoMode, session] = await Promise.all([isDemoMode(), getSession()])

  if (demoMode) {
    return <DemoBanner />
  }

  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true, businessName: true },
  })
  if (!user) return null

  const displayName = getDisplayName(user)

  return (
    <div className="flex min-h-11 shrink-0 items-center justify-center gap-3 overflow-hidden px-4 text-center text-sm font-medium sm:px-6">
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
