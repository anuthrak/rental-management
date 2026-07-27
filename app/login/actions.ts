"use server"

import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth/password"
import { clearDemoMode, clearSession, createSession, setDemoMode } from "@/lib/auth/session"
import { loginSchema } from "@/lib/auth/validation"

export type LoginActionState = { error: string } | undefined

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password" }
  }

  await clearDemoMode()
  await createSession(user)
  redirect("/dashboard")
}

export async function startDemoAction(): Promise<void> {
  await clearSession()
  await setDemoMode()
  redirect("/dashboard")
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  await clearDemoMode()
  redirect("/login")
}
