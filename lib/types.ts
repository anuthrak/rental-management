import { z } from "zod"

export const UNITS = ["m³", "kW", "$", "unit", "month"] as const
export type Unit = (typeof UNITS)[number]

export const CURRENCIES = ["USD", "KHR"] as const
export type Currency = (typeof CURRENCIES)[number]

export const LANGUAGES = ["en", "km"] as const
export type Language = (typeof LANGUAGES)[number]

export const lineItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  quantity: z.number().min(0, "Must be 0 or more"),
  unit: z.enum(UNITS),
  rate: z.number().min(0, "Must be 0 or more"),
  // Only meaningful for water (m³) / electric (kW) rows — when present,
  // quantity is derived as recentMeter - previousMeter instead of entered
  // directly (see meterUsage below).
  previousMeter: z.number().min(0, "Must be 0 or more").optional(),
  recentMeter: z.number().min(0, "Must be 0 or more").optional(),
  // True when previousMeter was seeded from a room's DB-backed meter
  // reading (invoice generated from the Room Drawer) — locks the field
  // read-only so it can't drift from the actual last reading. Standalone
  // drafts started on /invoice leave this unset so previousMeter stays
  // editable.
  previousMeterLocked: z.boolean().optional(),
})

export const invoiceSchema = z
  .object({
    id: z.string(),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    companyName: z.string().min(1, "Company name is required"),
    companyAddress: z.string(),
    roomNumber: z.string(),
    guestName: z.string().min(1, "Guest name is required"),
    nationalId: z.string(),
    dateIn: z.string().min(1, "Start date is required"),
    dateOut: z.string().min(1, "End date is required"),
    currency: z.enum(CURRENCIES),
    language: z.enum(LANGUAGES),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
    notes: z.string(),
    waterRateUsd: z.number().min(0, "Must be 0 or more"),
    electricRateUsd: z.number().min(0, "Must be 0 or more"),
    createdAt: z.string(),
  })
  .refine((v) => new Date(v.dateOut) >= new Date(v.dateIn), {
    message: "End date must be on or after the start date",
    path: ["dateOut"],
  })

export type LineItem = z.infer<typeof lineItemSchema>
export type Invoice = z.infer<typeof invoiceSchema>

export type LineItemWithAmount = LineItem & { amount: number }

export function meterUsage(recent: number, previous: number): number {
  return Math.max(0, recent - previous)
}
