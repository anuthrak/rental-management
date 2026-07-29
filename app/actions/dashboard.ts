"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

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
  input: { roomNumber: string; targetPrice: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  try {
    await prisma.room.create({
      data: {
        roomNumber: input.roomNumber,
        targetPrice: input.targetPrice,
        status: "VACANT",
        userId: session?.userId ?? null,
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
