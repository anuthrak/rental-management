import { z } from "zod"

export const UNITS = ["m³", "kW", "$", "unit", "month"] as const
export type Unit = (typeof UNITS)[number]

export const CURRENCIES = ["USD", "EUR", "GBP", "KES", "NGN", "ZAR", "INR"] as const
export type Currency = (typeof CURRENCIES)[number]

export const LANGUAGES = ["en", "km"] as const
export type Language = (typeof LANGUAGES)[number]

export const lineItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  quantity: z.number().min(0, "Must be 0 or more"),
  unit: z.enum(UNITS),
  rate: z.number().min(0, "Must be 0 or more"),
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
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    currency: z.enum(CURRENCIES),
    language: z.enum(LANGUAGES),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
    createdAt: z.string(),
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  })

export type LineItem = z.infer<typeof lineItemSchema>
export type Invoice = z.infer<typeof invoiceSchema>

export type LineItemWithAmount = LineItem & { amount: number }
