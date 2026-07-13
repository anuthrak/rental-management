import type { Invoice, LineItem, LineItemWithAmount } from "@/lib/types"

export function lineAmount(item: Pick<LineItem, "quantity" | "rate">): number {
  const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
  return Math.round(amount * 100) / 100
}

export function withAmounts(items: LineItem[]): LineItemWithAmount[] {
  return items.map((item) => ({ ...item, amount: lineAmount(item) }))
}

export function computeTotals(items: LineItem[]) {
  const subtotal = items.reduce((sum, item) => sum + lineAmount(item), 0)
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
  }
}

export function invoiceTotals(invoice: Invoice) {
  return computeTotals(invoice.lineItems)
}
