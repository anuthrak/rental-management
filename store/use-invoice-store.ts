"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Invoice, LineItem, Unit } from "@/lib/types"
import { invoiceSchema } from "@/lib/types"
import { formatInvoiceNumber, nextInvoiceNumber } from "@/lib/invoice-number"
import { SECURITY_FEE_AMOUNT, SECURITY_FEE_ID } from "@/lib/calc"

const NOTES_PLACEHOLDER = [
  "Payment is due within 7 days of the invoice date.",
  "Late payments may incur an additional fee.",
  "Please make checks payable to the business name above.",
  "For questions about this invoice, contact the office.",
  "Thank you for being a valued tenant.",
].join("\n")

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export type Draft = Omit<Invoice, "createdAt">

function makeDraft(invoiceNumber = formatInvoiceNumber(1)): Draft {
  return {
    id: uid(),
    invoiceNumber,
    companyName: "Riverside Apartments",
    companyAddress: "42 Riverside Rd, Nairobi",
    roomNumber: "",
    guestName: "",
    nationalId: "",
    startDate: firstOfMonth(),
    endDate: today(),
    issueDate: today(),
    dueDate: today(),
    currency: "USD",
    language: "en",
    lineItems: [],
    notes: NOTES_PLACEHOLDER,
    waterUsageM3: 0,
    electricUsageKWh: 0,
  }
}

export function newLineItem(partial?: Partial<LineItem>): LineItem {
  return {
    id: uid(),
    label: "",
    quantity: 1,
    unit: "unit",
    rate: 0,
    ...partial,
  }
}

interface InvoiceState {
  draft: Draft
  savedInvoices: Invoice[]
  errors: Record<string, string>
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  validateDraft: () => boolean
  clearErrors: () => void
  updateDraft: (patch: Partial<Draft>) => void
  addLineItem: (partial?: Partial<LineItem>) => void
  updateLineItem: (id: string, patch: Partial<LineItem>) => void
  removeLineItem: (id: string) => void
  moveLineItem: (fromIndex: number, toIndex: number) => void
  toggleSecurityFee: (label: string) => void
  resetDraft: () => void
  saveInvoice: () => Invoice
  loadInvoice: (id: string) => void
  deleteInvoice: (id: string) => void
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      draft: makeDraft(),
      savedInvoices: [],
      errors: {},
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      validateDraft: () => {
        const { draft } = get()
        const result = invoiceSchema.safeParse({
          ...draft,
          createdAt: new Date().toISOString(),
        })
        if (result.success) {
          set({ errors: {} })
          return true
        }
        const errors: Record<string, string> = {}
        for (const issue of result.error.issues) {
          const key = issue.path.join(".")
          if (!errors[key]) errors[key] = issue.message
        }
        set({ errors })
        return false
      },
      clearErrors: () => set({ errors: {} }),
      updateDraft: (patch) =>
        set((s) => ({ draft: { ...s.draft, ...patch }, errors: {} })),
      addLineItem: (partial) =>
        set((s) => ({
          errors: {},
          draft: {
            ...s.draft,
            lineItems: [...s.draft.lineItems, newLineItem(partial)],
          },
        })),
      updateLineItem: (id, patch) =>
        set((s) => ({
          errors: {},
          draft: {
            ...s.draft,
            lineItems: s.draft.lineItems.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        })),
      removeLineItem: (id) =>
        set((s) => ({
          errors: {},
          draft: {
            ...s.draft,
            lineItems: s.draft.lineItems.filter((item) => item.id !== id),
          },
        })),
      moveLineItem: (fromIndex, toIndex) =>
        set((s) => {
          const items = [...s.draft.lineItems]
          if (
            fromIndex < 0 ||
            fromIndex >= items.length ||
            toIndex < 0 ||
            toIndex >= items.length
          ) {
            return s
          }
          const [moved] = items.splice(fromIndex, 1)
          items.splice(toIndex, 0, moved)
          return { draft: { ...s.draft, lineItems: items } }
        }),
      toggleSecurityFee: (label) =>
        set((s) => {
          const exists = s.draft.lineItems.some((item) => item.id === SECURITY_FEE_ID)
          return {
            errors: {},
            draft: {
              ...s.draft,
              lineItems: exists
                ? s.draft.lineItems.filter((item) => item.id !== SECURITY_FEE_ID)
                : [
                    ...s.draft.lineItems,
                    {
                      id: SECURITY_FEE_ID,
                      label,
                      quantity: 1,
                      unit: "$" as Unit,
                      rate: SECURITY_FEE_AMOUNT,
                    },
                  ],
            },
          }
        }),
      resetDraft: () =>
        set((s) => ({
          draft: {
            ...makeDraft(nextInvoiceNumber(s.savedInvoices)),
            currency: s.draft.currency,
            language: s.draft.language,
            companyName: s.draft.companyName,
            companyAddress: s.draft.companyAddress,
          },
        })),
      saveInvoice: () => {
        const { draft, savedInvoices } = get()
        const saved: Invoice = { ...draft, createdAt: new Date().toISOString() }
        const existingIndex = savedInvoices.findIndex((i) => i.id === draft.id)
        const nextSaved =
          existingIndex >= 0
            ? savedInvoices.map((i, idx) => (idx === existingIndex ? saved : i))
            : [saved, ...savedInvoices]
        set({
          savedInvoices: nextSaved,
          draft: {
            ...makeDraft(nextInvoiceNumber(nextSaved)),
            currency: draft.currency,
            language: draft.language,
            companyName: draft.companyName,
            companyAddress: draft.companyAddress,
          },
        })
        return saved
      },
      loadInvoice: (id) =>
        set((s) => {
          const found = s.savedInvoices.find((i) => i.id === id)
          if (!found) return s
          const { createdAt: _createdAt, ...rest } = found
          return { draft: { ...rest } }
        }),
      deleteInvoice: (id) =>
        set((s) => ({
          savedInvoices: s.savedInvoices.filter((i) => i.id !== id),
        })),
    }),
    {
      name: "rentledger-store",
      partialize: (s) => ({ draft: s.draft, savedInvoices: s.savedInvoices }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

export const UNIT_OPTIONS: Unit[] = ["m³", "kW", "$", "unit", "month"]
