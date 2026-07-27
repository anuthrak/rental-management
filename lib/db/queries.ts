import { prisma } from "@/lib/prisma"
import type { InvoiceStatus, RoomStatus } from "@prisma/client"

export type RoomInvoice = {
  id: string
  amountDue: number
  dueDate: Date
  status: InvoiceStatus
  isOverdue: boolean
}

export type DashboardRoom = {
  id: string
  roomNumber: string
  targetPrice: number
  status: RoomStatus
  lease: { id: string; agreedRent: number } | null
  tenant: {
    id: string
    fullName: string
    phone: string | null
    email: string | null
  } | null
  invoices: RoomInvoice[]
}

export async function getRooms(): Promise<DashboardRoom[]> {
  const now = new Date()
  const rooms = await prisma.room.findMany({
    orderBy: { roomNumber: "asc" },
    include: {
      leases: { where: { isActive: true }, take: 1, include: { tenant: true } },
      invoices: { orderBy: { dueDate: "desc" } },
    },
  })

  return rooms.map((room) => {
    const lease = room.leases[0] ?? null
    return {
      id: room.id,
      roomNumber: room.roomNumber,
      targetPrice: room.targetPrice.toNumber(),
      status: room.status,
      lease: lease ? { id: lease.id, agreedRent: lease.agreedRent.toNumber() } : null,
      tenant: lease
        ? {
            id: lease.tenant.id,
            fullName: lease.tenant.fullName,
            phone: lease.tenant.phone,
            email: lease.tenant.email,
          }
        : null,
      invoices: room.invoices.map((invoice) => ({
        id: invoice.id,
        amountDue: invoice.amountDue.toNumber(),
        dueDate: invoice.dueDate,
        status: invoice.status,
        isOverdue: invoice.status === "UNPAID" && invoice.dueDate < now,
      })),
    }
  })
}

export type DashboardInvoice = {
  id: string
  amountDue: number
  dueDate: Date
  status: InvoiceStatus
  isOverdue: boolean
  roomId: string
  roomNumber: string
  tenantName: string
}

export async function getInvoices(): Promise<DashboardInvoice[]> {
  const now = new Date()
  const invoices = await prisma.invoice.findMany({
    orderBy: { dueDate: "desc" },
    include: { room: true, tenant: true },
  })

  return invoices.map((invoice) => ({
    id: invoice.id,
    amountDue: invoice.amountDue.toNumber(),
    dueDate: invoice.dueDate,
    status: invoice.status,
    isOverdue: invoice.status === "UNPAID" && invoice.dueDate < now,
    roomId: invoice.roomId,
    roomNumber: invoice.room.roomNumber,
    tenantName: invoice.tenant.fullName,
  }))
}

export type DashboardMetrics = {
  occupiedCount: number
  totalRooms: number
  occupancyRate: number
  totalCollectedThisMonth: number
  totalOverdueThisMonth: number
  overdueInvoiceCount: number
}

// "Overdue" is derived at query time (UNPAID + past due date) rather than a
// background job flipping status to OVERDUE, to keep this MVP cron-free.
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const overdueClause = {
    OR: [{ status: "OVERDUE" as const }, { status: "UNPAID" as const, dueDate: { lt: now } }],
  }

  const [totalRooms, occupiedCount, paidThisMonth, overdueThisMonth, overdueAll] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: "OCCUPIED" } }),
    prisma.invoice.findMany({
      where: { status: "PAID", dueDate: { gte: monthStart, lt: monthEnd } },
      select: { amountDue: true },
    }),
    prisma.invoice.findMany({
      where: { dueDate: { gte: monthStart, lt: monthEnd }, ...overdueClause },
      select: { amountDue: true },
    }),
    prisma.invoice.findMany({
      where: overdueClause,
      select: { id: true },
    }),
  ])

  const totalCollectedThisMonth = paidThisMonth.reduce((sum, inv) => sum + inv.amountDue.toNumber(), 0)
  const totalOverdueThisMonth = overdueThisMonth.reduce((sum, inv) => sum + inv.amountDue.toNumber(), 0)

  return {
    occupiedCount,
    totalRooms,
    occupancyRate: totalRooms === 0 ? 0 : Math.round((occupiedCount / totalRooms) * 100),
    totalCollectedThisMonth,
    totalOverdueThisMonth,
    overdueInvoiceCount: overdueAll.length,
  }
}
