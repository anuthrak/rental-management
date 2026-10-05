"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { getFloorCapacity, getMaxRoomFloor, getScopedData, getUserFloorCount } from "@/lib/db/queries"
import { MAX_FLOOR_COUNT, MIN_FLOOR_COUNT, deriveFloorFromRoomNumber } from "@/lib/rooms"

// Validates/clamps a candidate floor value against the global
// [MIN_FLOOR_COUNT, MAX_FLOOR_COUNT] bound always, and additionally against
// the caller's own effective ceiling when signed in. That ceiling is the
// union of the account's declared floorCount and the highest floor any of
// its rooms already occupies (see the floorCount doc comment on the User
// model) — a floor that already has a real room on it must never become
// unassignable just because floorCount hasn't been raised to match, matching
// the union logic room-grid.tsx already uses to compute floor chips. Guests
// have no authoritative server-side floorCount to check against (their local
// floorCount never round-trips to the server, see GridLayoutSetupModal), so
// only the global bound applies to them.
async function resolveValidFloor(
  floor: number,
  userId: string | null,
): Promise<{ ok: true; floor: number } | { ok: false; error: string }> {
  const rounded = Math.round(floor)
  if (!Number.isFinite(rounded) || rounded < MIN_FLOOR_COUNT || rounded > MAX_FLOOR_COUNT) {
    return { ok: false, error: "Enter a valid floor" }
  }
  if (userId) {
    const [floorCount, maxRoomFloor] = await Promise.all([
      getUserFloorCount(userId),
      getMaxRoomFloor(userId),
    ])
    const ceiling = Math.max(floorCount, maxRoomFloor ?? 1)
    if (rounded > ceiling) {
      return { ok: false, error: "Enter a valid floor" }
    }
  }
  return { ok: true, floor: rounded }
}

// Authoritative capacity check — call after resolveValidFloor has already
// confirmed `floor` is in-range. `excludeRoomId` lets updateRoomFloor count
// the target floor's *other* occupants only; the room being moved isn't on
// that floor yet (or, for a same-floor no-op edit, shouldn't count against
// itself).
async function checkFloorCapacity(
  userId: string | null,
  floor: number,
  excludeRoomId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [capacity, count] = await Promise.all([
    getFloorCapacity(userId, floor),
    prisma.room.count({
      where: { ...getScopedData(userId), floor, ...(excludeRoomId ? { id: { not: excludeRoomId } } : {}) },
    }),
  ])
  if (count >= capacity) {
    return { ok: false, error: "This floor is full — increase its grid size or free up a slot first" }
  }
  return { ok: true }
}

export async function updateRoomTargetPrice(roomId: string, targetPrice: number) {
  await prisma.room.update({
    where: { id: roomId },
    data: { targetPrice },
  })
  revalidatePath("/")
}

export async function updateRoomName(
  roomId: string,
  roomNumber: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = roomNumber.trim()
  if (!trimmed) {
    return { ok: false, error: "Room name is required" }
  }
  try {
    await prisma.room.update({
      where: { id: roomId },
      // floor is no longer recomputed here — renaming a room must never
      // silently move it off a floor the landlord set explicitly (via the
      // Floor field / inline editor). See updateRoomFloor for the dedicated
      // floor-assignment path.
      data: { roomNumber: trimmed },
    })
  } catch {
    // Most likely the @@unique([userId, roomNumber]) constraint — another
    // room in this account already has that name.
    return { ok: false, error: "Room number already exists" }
  }
  revalidatePath("/")
  revalidatePath("/payments")
  return { ok: true }
}

export async function updateRoomFloor(
  roomId: string,
  floor: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  const result = await resolveValidFloor(floor, session?.userId ?? null)
  if (!result.ok) return result

  const capacityCheck = await checkFloorCapacity(session?.userId ?? null, result.floor, roomId)
  if (!capacityCheck.ok) return capacityCheck

  const { count } = await prisma.room.updateMany({
    // Scoped to the caller's own userId (null for guests, matching this
    // file's getScopedData convention) — without this, any caller could
    // pass an arbitrary roomId belonging to a different account and move
    // that room to a different floor.
    where: { id: roomId, userId: session?.userId ?? null },
    // gridRow/gridCol intentionally left untouched — floor and grid-cell
    // position are independent coordinate spaces; the room just shows up
    // as unassigned on its new floor until re-placed there.
    data: { floor: result.floor },
  })
  if (count === 0) {
    return { ok: false, error: "Room not found" }
  }
  revalidatePath("/")
  return { ok: true }
}

export async function assignTenant(
  roomId: string,
  input: { fullName: string; phone: string; agreedRent: number },
) {
  const session = await getSession()
  const userId = session?.userId ?? null
  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { fullName: input.fullName, phone: input.phone, roomId, userId },
    })
    await tx.lease.create({
      data: {
        roomId,
        tenantId: tenant.id,
        userId,
        agreedRent: input.agreedRent,
        startDate: new Date(),
        isActive: true,
      },
    })
    await tx.room.update({
      where: { id: roomId },
      data: { status: "OCCUPIED" },
    })
  })
  revalidatePath("/")
}

export async function endLease(leaseId: string, roomId: string, tenantId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.lease.update({
      where: { id: leaseId },
      data: { isActive: false, endDate: new Date() },
    })
    await tx.room.update({
      where: { id: roomId },
      data: { status: "VACANT" },
    })
    await tx.tenant.update({
      where: { id: tenantId },
      data: { roomId: null },
    })
  })
  revalidatePath("/")
}

export async function setInvoiceStatus(invoiceId: string, status: "PAID" | "UNPAID") {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  })
  revalidatePath("/")
  revalidatePath("/payments")
}

export async function logMeterReading(input: {
  roomId: string
  waterMeterValue: number
  electricMeterValue: number
  notes?: string
}) {
  await prisma.meterReading.create({
    data: {
      roomId: input.roomId,
      waterMeterValue: input.waterMeterValue,
      electricMeterValue: input.electricMeterValue,
      notes: input.notes?.trim() ? input.notes.trim() : null,
    },
  })
  revalidatePath("/")
}

export async function createRoom(
  input: { roomNumber: string; targetPrice: number; floor?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  const userId = session?.userId ?? null

  let floor: number
  if (input.floor !== undefined) {
    const result = await resolveValidFloor(input.floor, userId)
    if (!result.ok) return result
    floor = result.floor
  } else {
    // Back-compat fallback for any caller that doesn't pass floor
    // explicitly — AddRoomCard always passes it in practice.
    floor = deriveFloorFromRoomNumber(input.roomNumber)
  }

  const capacityCheck = await checkFloorCapacity(userId, floor)
  if (!capacityCheck.ok) return capacityCheck

  try {
    await prisma.room.create({
      data: {
        roomNumber: input.roomNumber,
        floor,
        targetPrice: input.targetPrice,
        status: "VACANT",
        userId,
      },
    })
  } catch {
    return { ok: false, error: "Room number already exists" }
  }
  revalidatePath("/")
  revalidatePath("/payments")
  return { ok: true }
}

export async function createInvoiceRecord(input: {
  roomId: string
  tenantId: string
  leaseId: string | null
  amountDue: number
  dueDate: string
}) {
  const session = await getSession()
  await prisma.invoice.create({
    data: {
      roomId: input.roomId,
      tenantId: input.tenantId,
      leaseId: input.leaseId,
      amountDue: input.amountDue,
      dueDate: new Date(input.dueDate),
      status: "UNPAID",
      userId: session?.userId ?? null,
    },
  })
  revalidatePath("/")
}
