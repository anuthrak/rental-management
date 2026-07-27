"use server"

import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { clearDemoMode, createSession } from "@/lib/auth/session"
import { signupSchema } from "@/lib/auth/validation"

export type SignupActionState = { error: string } | undefined

export async function signupAction(
  _prevState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
  })

  await clearDemoMode()
  await createSession(user)
  redirect("/dashboard")
}
