"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"

export async function updateRoomTargetPrice(roomId: string, targetPrice: number) {
  await prisma.room.update({
    where: { id: roomId },
    data: { targetPrice },
  })
  revalidatePath("/dashboard")
}

export async function assignTenant(
  roomId: string,
  input: { fullName: string; phone: string; agreedRent: number },
) {
  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { fullName: input.fullName, phone: input.phone, roomId },
    })
    await tx.lease.create({
      data: {
        roomId,
        tenantId: tenant.id,
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
  revalidatePath("/dashboard")
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
  revalidatePath("/dashboard")
}

export async function markInvoicePaid(invoiceId: string) {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID" },
  })
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/payments")
}

export async function createInvoiceRecord(input: {
  roomId: string
  tenantId: string
  leaseId: string | null
  amountDue: number
  dueDate: string
}) {
  await prisma.invoice.create({
    data: {
      roomId: input.roomId,
      tenantId: input.tenantId,
      leaseId: input.leaseId,
      amountDue: input.amountDue,
      dueDate: new Date(input.dueDate),
      status: "UNPAID",
    },
  })
  revalidatePath("/dashboard")
}
