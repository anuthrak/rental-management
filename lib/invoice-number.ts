import type { Invoice } from "@/lib/types"

export function nextInvoiceNumber(existing: Invoice[]): string {
  const highest = existing.reduce((max, invoice) => {
    const numeric = Number.parseInt(invoice.invoiceNumber.replace(/\D/g, ""), 10)
    return Number.isNaN(numeric) ? max : Math.max(max, numeric)
  }, 0)
  return formatInvoiceNumber(highest + 1)
}

export function formatInvoiceNumber(value: number): string {
  return `#${String(value).padStart(4, "0")}`
}
