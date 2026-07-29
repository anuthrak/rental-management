"use server"

import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getSession, isDemoMode } from "@/lib/auth/session"

export type OnboardingTenantInput = {
  roomNumber: string
  fullName: string
  phone: string
  email: string
  nationalId: string
  leaseStartDate: string
  leaseEndDate: string
  agreedRent: number
  securityDeposit: number
  securityDepositStatus: "HELD" | "REFUNDED" | "APPLIED_TO_RENT"
}

export type OnboardingSubmission = {
  businessName: string
  currency: "USD" | "KHR"
  waterRate: number
  electricRate: number
  invoiceNoteTemplate: string
  rooms: {
    roomNumber: string
    targetPrice: number
    waterMeterStart: number
    electricMeterStart: number
  }[]
  tenants: OnboardingTenantInput[]
}

export type UserPreferencesInput = {
  currency: "USD" | "KHR"
  waterRate: number
  electricRate: number
  invoiceNoteTemplate: string
}

// Creates the user's Property settings, Rooms, Tenants, and Leases in a
// single transaction tied to their userId. Called once from the onboarding
// wizard's final step.
export async function completeOnboarding(
  input: OnboardingSubmission,
): Promise<{ error: string } | undefined> {
  const session = await getSession()
  if (!session) redirect("/login")

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.userId },
        data: {
          businessName: input.businessName.trim() || null,
          currencyPreference: input.currency,
          defaultWaterRate: input.waterRate,
          defaultElectricRate: input.electricRate,
          invoiceNoteTemplate: input.invoiceNoteTemplate,
        },
      })

      const tenantsByRoom = new Map(
        input.tenants.filter((t) => t.roomNumber).map((t) => [t.roomNumber, t]),
      )

      for (const room of input.rooms) {
        if (!room.roomNumber.trim()) continue
        const tenantInput = tenantsByRoom.get(room.roomNumber)

        const createdRoom = await tx.room.create({
          data: {
            roomNumber: room.roomNumber,
            targetPrice: room.targetPrice,
            status: tenantInput ? "OCCUPIED" : "VACANT",
            userId: session.userId,
          },
        })

        await tx.meterReading.create({
          data: {
            roomId: createdRoom.id,
            waterMeterValue: room.waterMeterStart,
            electricMeterValue: room.electricMeterStart,
            notes: "Initial reading (onboarding)",
          },
        })

        if (!tenantInput) continue

        const tenant = await tx.tenant.create({
          data: {
            fullName: tenantInput.fullName,
            phone: tenantInput.phone || null,
            email: tenantInput.email || null,
            nationalId: tenantInput.nationalId || null,
            roomId: createdRoom.id,
            userId: session.userId,
          },
        })

        await tx.lease.create({
          data: {
            roomId: createdRoom.id,
            tenantId: tenant.id,
            userId: session.userId,
            agreedRent: tenantInput.agreedRent,
            startDate: new Date(tenantInput.leaseStartDate || new Date().toISOString().slice(0, 10)),
            endDate: tenantInput.leaseEndDate ? new Date(tenantInput.leaseEndDate) : null,
            securityDeposit: tenantInput.securityDeposit,
            securityDepositStatus: tenantInput.securityDepositStatus,
            isActive: true,
          },
        })
      }
    })
  } catch (err) {
    console.error("[onboarding] setup failed:", err)
    return { error: "Something went wrong finishing setup. Please try again." }
  }

  redirect("/")
}

export async function skipOnboarding(): Promise<void> {
  const session = await getSession()
  if (!session && !(await isDemoMode())) redirect("/login")
  redirect("/")
}

// Standalone preference update, independent of room/tenant setup — usable
// from a future account settings page without re-running onboarding.
export async function updateUserPreferences(
  input: UserPreferencesInput,
): Promise<{ error: string } | undefined> {
  const session = await getSession()
  if (!session) redirect("/login")

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        currencyPreference: input.currency,
        defaultWaterRate: input.waterRate,
        defaultElectricRate: input.electricRate,
        invoiceNoteTemplate: input.invoiceNoteTemplate,
      },
    })
  } catch (err) {
    console.error("[onboarding] preferences update failed:", err)
    return { error: "Could not save preferences. Please try again." }
  }
}
