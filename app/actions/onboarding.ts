"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getSession, isDemoMode } from "@/lib/auth/session"
import { MAX_FLOOR_COUNT, MIN_FLOOR_COUNT, deriveGridForRoomCount } from "@/lib/rooms"

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
  floorCount: number
  // length === floorCount, index i = declared capacity for floor i+1.
  roomsPerFloor: number[]
  rooms: {
    roomNumber: string
    targetPrice: number
    floor: number
    waterMeterStart: number
    electricMeterStart: number
  }[]
  tenants: OnboardingTenantInput[]
}

export type UserPreferencesInput = {
  // Not in the original signature — added so the Settings page's Property &
  // Business section (business name + currency) can save through this same
  // action rather than needing a bespoke one. Deviation from the technical
  // spec's "no signature change needed for C2-C4" note, which appears to
  // have overlooked that business name had no persistence path otherwise.
  businessName: string
  currency: "USD" | "KHR"
  waterRate: number
  electricRate: number
  invoiceNoteTemplate: string
  simpleModeDefault: boolean
}

// Creates the user's Property settings, Rooms, Tenants, and Leases in a
// single transaction tied to their userId. Called once from the onboarding
// wizard's final step.
export async function completeOnboarding(
  input: OnboardingSubmission,
): Promise<{ error: string } | undefined> {
  const session = await getSession()
  if (!session) redirect("/login")

  // Server-side re-validation — never trust the client submission blindly,
  // same principle as Part A's server-authoritative checkFloorCapacity.
  const floorCount = Math.round(input.floorCount)
  if (!Number.isFinite(floorCount) || floorCount < MIN_FLOOR_COUNT || floorCount > MAX_FLOOR_COUNT) {
    return { error: "Enter a valid number of floors" }
  }
  if (input.roomsPerFloor.length !== floorCount) {
    return { error: "Enter a valid number of floors" }
  }
  if (input.rooms.some((r) => r.roomNumber.trim() && (r.floor < 1 || r.floor > floorCount))) {
    return { error: "One or more rooms has an invalid floor" }
  }

  // Group the submitted rooms by floor and compare each floor's actual
  // assigned room count against the capacity its declared roomsPerFloor
  // value derives to. Pricing-model-agnostic — for the standard model this
  // can never actually fail (the room list *is* roomsPerFloor by
  // construction), so it's really only a live guard for the custom model
  // plus a defense against a tampered/buggy client payload either way.
  const roomsByFloor = new Map<number, number>()
  for (const room of input.rooms) {
    if (!room.roomNumber.trim()) continue
    roomsByFloor.set(room.floor, (roomsByFloor.get(room.floor) ?? 0) + 1)
  }
  for (let floor = 1; floor <= floorCount; floor++) {
    const { rows, cols } = deriveGridForRoomCount(input.roomsPerFloor[floor - 1] ?? 0)
    if ((roomsByFloor.get(floor) ?? 0) > rows * cols) {
      return { error: "One or more floors has more rooms than its declared capacity" }
    }
  }

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
          floorCount,
        },
      })

      for (let floor = 1; floor <= floorCount; floor++) {
        const { rows, cols } = deriveGridForRoomCount(input.roomsPerFloor[floor - 1] ?? 0)
        await tx.floorPlanLayout.upsert({
          where: { userId_floor: { userId: session.userId, floor } },
          create: { userId: session.userId, floor, rows, cols },
          update: { rows, cols },
        })
      }

      const tenantsByRoom = new Map(
        input.tenants.filter((t) => t.roomNumber).map((t) => [t.roomNumber, t]),
      )

      for (const room of input.rooms) {
        if (!room.roomNumber.trim()) continue
        const tenantInput = tenantsByRoom.get(room.roomNumber)

        const createdRoom = await tx.room.create({
          data: {
            roomNumber: room.roomNumber,
            floor: room.floor,
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

  // The `tour` flag tells the dashboard's GuidedTour to auto-launch once;
  // it's stripped from the URL immediately after the tour picks it up.
  redirect("/?tour=1")
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
        businessName: input.businessName.trim() || null,
        currencyPreference: input.currency,
        defaultWaterRate: input.waterRate,
        defaultElectricRate: input.electricRate,
        invoiceNoteTemplate: input.invoiceNoteTemplate,
        simpleModeDefault: input.simpleModeDefault,
      },
    })
  } catch (err) {
    console.error("[onboarding] preferences update failed:", err)
    return { error: "Could not save preferences. Please try again." }
  }
  revalidatePath("/settings")
  revalidatePath("/")
}
