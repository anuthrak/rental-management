import { prisma } from "@/lib/prisma"
import type { InvoiceStatus, RoomStatus } from "@prisma/client"
import { DEFAULT_INVOICE_NOTES } from "@/lib/invoice-notes"
import type { Currency, Language } from "@/lib/types"

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

// Same guest fallback pattern as getUserCurrencyPreference — demo mode has
// no User row, so it gets the same default (1 floor) a brand-new account
// starts with.
export async function getUserFloorCount(userId: string | null): Promise<number> {
  if (!userId) return 1
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { floorCount: true },
  })
  return user?.floorCount ?? 1
}

// User.invoiceNoteTemplate stays NULL until an account explicitly saves one
// (via onboarding or the future settings page). Returns the raw value —
// null means "nothing saved yet" — so callers can tell that apart from a
// saved template that happens to match a default's text. Used by the
// invoice generator to decide whether it's safe to apply the account's
// template over the client's local draft (see applyAccountNoteTemplate in
// store/use-invoice-store.ts).
export async function getUserInvoiceNoteTemplateRaw(userId: string | null): Promise<string | null> {
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { invoiceNoteTemplate: true },
  })
  return user?.invoiceNoteTemplate ?? null
}

// Same fallback semantics as getUserInvoiceNoteTemplateRaw, but always
// resolves to a renderable string — coalesces to the localized default T&Cs
// (lib/invoice-notes.ts) without ever writing that fallback back to the
// row, so a real customization is never overwritten and an existing
// NULL-valued account picks up updated default copy for free the next time
// this is read.
export async function getUserInvoiceNoteTemplate(
  userId: string | null,
  language: Language,
): Promise<string> {
  return (await getUserInvoiceNoteTemplateRaw(userId)) ?? DEFAULT_INVOICE_NOTES[language]
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
  floor: number
  wing: string | null
  position: number
  isVip: boolean
  stairAfter: boolean
  gridRow: number | null
  gridCol: number | null
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
      floor: room.floor,
      wing: room.wing,
      position: room.position,
      isVip: room.isVip,
      stairAfter: room.stairAfter,
      gridRow: room.gridRow,
      gridCol: room.gridCol,
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

// Distinct floors present across a room set, ascending — drives the floor
// navigation tabs without a separate DB round trip.
export function getFloors(rooms: DashboardRoom[]): number[] {
  return [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b)
}

export type FloorPlanDimensions = { rows: number; cols: number }

// Custom Layout grid size per floor. Demo/guest sessions (userId null) have
// no account to own a FloorPlanLayout row, so the Custom Layout view falls
// back to purely client-local storage for them instead of calling this.
export async function getFloorPlanLayouts(
  userId: string,
): Promise<Record<number, FloorPlanDimensions>> {
  const layouts = await prisma.floorPlanLayout.findMany({ where: { userId } })
  return Object.fromEntries(layouts.map((l) => [l.floor, { rows: l.rows, cols: l.cols }]))
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
