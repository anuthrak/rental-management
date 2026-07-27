import { prisma } from "@/lib/prisma"
import type { InvoiceStatus, RoomStatus } from "@prisma/client"
import type { Currency } from "@/lib/types"

// A NULL userId is the shared public demo dataset; a specific userId scopes
// to that registered account's own rows. Pass this into a query's `where`.
export function getScopedData(userId: string | null): { userId: string | null } {
  return { userId }
}

// Demo/guest mode (userId null) has no User row to read a preference from,
// so it falls back to USD — the same default a brand-new account starts with.
export async function getUserCurrencyPreference(userId: string | null): Promise<Currency> {
  if (!userId) return "USD"
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currencyPreference: true },
  })
  return (user?.currencyPreference as Currency) ?? "USD"
}

export type RoomInvoice = {
  id: string
  amountDue: number
  dueDate: Date
  status: InvoiceStatus
  isOverdue: boolean
}

export type MeterReadingItem = {
  id: string
  readingDate: Date
  waterMeterValue: number
  electricMeterValue: number
  notes: string | null
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
  meterReadings: MeterReadingItem[]
}

export async function getRooms(userId?: string | null): Promise<DashboardRoom[]> {
  const now = new Date()
  const rooms = await prisma.room.findMany({
    where: userId !== undefined ? getScopedData(userId) : undefined,
    orderBy: { roomNumber: "asc" },
    include: {
      leases: { where: { isActive: true }, take: 1, include: { tenant: true } },
      invoices: { orderBy: { dueDate: "desc" } },
      meterReadings: { orderBy: { readingDate: "desc" }, take: 12 },
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
      meterReadings: room.meterReadings.map((reading) => ({
        id: reading.id,
        readingDate: reading.readingDate,
        waterMeterValue: reading.waterMeterValue.toNumber(),
        electricMeterValue: reading.electricMeterValue.toNumber(),
        notes: reading.notes,
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
  tenantPhone: string | null
}

export async function getInvoices(userId?: string | null): Promise<DashboardInvoice[]> {
  const now = new Date()
  const invoices = await prisma.invoice.findMany({
    where: userId !== undefined ? getScopedData(userId) : undefined,
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
    tenantPhone: invoice.tenant.phone,
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
export async function getDashboardMetrics(userId?: string | null): Promise<DashboardMetrics> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const scope = userId !== undefined ? getScopedData(userId) : {}
  const overdueClause = {
    OR: [{ status: "OVERDUE" as const }, { status: "UNPAID" as const, dueDate: { lt: now } }],
  }

  const [totalRooms, occupiedCount, paidThisMonth, overdueThisMonth, overdueAll] = await Promise.all([
    prisma.room.count({ where: scope }),
    prisma.room.count({ where: { ...scope, status: "OCCUPIED" } }),
    prisma.invoice.findMany({
      where: { ...scope, status: "PAID", dueDate: { gte: monthStart, lt: monthEnd } },
      select: { amountDue: true },
    }),
    prisma.invoice.findMany({
      where: { ...scope, dueDate: { gte: monthStart, lt: monthEnd }, ...overdueClause },
      select: { amountDue: true },
    }),
    prisma.invoice.findMany({
      where: { ...scope, ...overdueClause },
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
