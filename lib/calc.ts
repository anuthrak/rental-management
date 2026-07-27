import type { Invoice, LineItem, LineItemWithAmount } from "@/lib/types"

// Standard utility billing rates. Utility usage is tracked separately from
// line items and shown as a reference-only note — it never feeds the
// invoice grand total.
export const WATER_RATE_USD = 0.5
export const ELECTRIC_RATE_USD = 0.25

// Fixed peg used to show a secondary Riel amount alongside USD totals.
export const USD_TO_KHR_RATE = 4000

export function usdToKhr(amountUsd: number): number {
  return Math.round((amountUsd || 0) * USD_TO_KHR_RATE)
}

export function waterCost(usageM3: number, rateUsd: number = WATER_RATE_USD): number {
  return Math.round((usageM3 || 0) * rateUsd * 100) / 100
}

export function electricCost(usageKWh: number, rateUsd: number = ELECTRIC_RATE_USD): number {
  return Math.round((usageKWh || 0) * rateUsd * 100) / 100
}

// Reserved line-item id so the security fee toggle can find/remove its own
// row without tracking a separate boolean flag on the draft.
export const SECURITY_FEE_ID = "security-fee-standard"
export const SECURITY_FEE_AMOUNT = 10

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
