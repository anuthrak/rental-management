import type { DashboardRoom, RoomInvoice } from "@/lib/db/queries"

export type AttentionRoom = {
  room: DashboardRoom
  invoice: RoomInvoice
}

// A room "needs attention" if it has at least one invoice that isn't paid
// yet (whether or not it's already overdue). Among a room's unpaid
// invoices, the most urgent one is surfaced: overdue first, then the
// earliest due date.
export function getAttentionRooms(rooms: DashboardRoom[]): AttentionRoom[] {
  const result: AttentionRoom[] = []
  for (const room of rooms) {
    const unpaid = room.invoices.filter((invoice) => invoice.status !== "PAID")
    if (unpaid.length === 0) continue
    const [mostUrgent] = [...unpaid].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      return a.dueDate.getTime() - b.dueDate.getTime()
    })
    result.push({ room, invoice: mostUrgent })
  }
  return result
}

export function daysOverdue(dueDate: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - dueDate.getTime()
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)))
}
