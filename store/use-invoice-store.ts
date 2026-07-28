"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Currency, Invoice, LineItem, Unit } from "@/lib/types"
import { invoiceSchema, meterUsage } from "@/lib/types"
import { formatInvoiceNumber, nextInvoiceNumber } from "@/lib/invoice-number"
import {
  ELECTRIC_RATE_USD,
  SECURITY_FEE_AMOUNT,
  SECURITY_FEE_ID,
  WATER_RATE_USD,
  usdToKhr,
} from "@/lib/calc"

// Utility rates are authored in USD; when the invoice currency is KHR,
// water/electric line items must carry their rate in KHR too so they sum
// correctly alongside manually-entered (already-in-currency) line items.
function scaledRate(rateUsd: number, currency: Currency): number {
  return currency === "KHR" ? usdToKhr(rateUsd) : rateUsd
}

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

// Every new draft starts with these three default categories so the user
// isn't staring at an empty table — quick-add below can still re-add any of
// them if deleted, or add extras.
function defaultLineItems(): LineItem[] {
  return [
    newLineItem({ label: "Room rate", quantity: 1, unit: "month", rate: 0 }),
    newLineItem({
      label: "Electricity",
      quantity: 0,
      unit: "kW",
      rate: ELECTRIC_RATE_USD,
      previousMeter: 0,
      recentMeter: 0,
    }),
    newLineItem({
      label: "Water",
      quantity: 0,
      unit: "m³",
      rate: WATER_RATE_USD,
      previousMeter: 0,
      recentMeter: 0,
    }),
  ]
}

function makeDraft(invoiceNumber = formatInvoiceNumber(1)): Draft {
  return {
    id: uid(),
    invoiceNumber,
    companyName: "Riverside Apartments",
    companyAddress: "42 Riverside Rd, Nairobi",
    roomNumber: "",
    guestName: "",
    nationalId: "",
    dateIn: firstOfMonth(),
    dateOut: today(),
    currency: "USD",
    language: "en",
    lineItems: defaultLineItems(),
    notes: NOTES_PLACEHOLDER,
    waterRateUsd: WATER_RATE_USD,
    electricRateUsd: ELECTRIC_RATE_USD,
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
        set((s) => {
          const nextDraft = { ...s.draft, ...patch }
          if (patch.currency && patch.currency !== s.draft.currency) {
            nextDraft.lineItems = nextDraft.lineItems.map((item) => {
              if (item.unit === "m³") {
                return { ...item, rate: scaledRate(nextDraft.waterRateUsd, nextDraft.currency) }
              }
              if (item.unit === "kW") {
                return { ...item, rate: scaledRate(nextDraft.electricRateUsd, nextDraft.currency) }
              }
              return item
            })
          }
          return { draft: nextDraft, errors: {} }
        }),
      addLineItem: (partial) =>
        set((s) => {
          let init = partial
          if (partial?.unit === "m³" && partial.rate === undefined) {
            init = { ...partial, rate: scaledRate(s.draft.waterRateUsd, s.draft.currency) }
          } else if (partial?.unit === "kW" && partial.rate === undefined) {
            init = { ...partial, rate: scaledRate(s.draft.electricRateUsd, s.draft.currency) }
          }
          return {
            errors: {},
            draft: {
              ...s.draft,
              lineItems: [...s.draft.lineItems, newLineItem(init)],
            },
          }
        }),
      updateLineItem: (id, patch) =>
        set((s) => {
          let nextPatch = patch
          if (patch.unit === "m³" && patch.rate === undefined) {
            nextPatch = { ...patch, rate: scaledRate(s.draft.waterRateUsd, s.draft.currency) }
          } else if (patch.unit === "kW" && patch.rate === undefined) {
            nextPatch = { ...patch, rate: scaledRate(s.draft.electricRateUsd, s.draft.currency) }
          }
          if (nextPatch.previousMeter !== undefined || nextPatch.recentMeter !== undefined) {
            const current = s.draft.lineItems.find((item) => item.id === id)
            const previousMeter = nextPatch.previousMeter ?? current?.previousMeter ?? 0
            const recentMeter = nextPatch.recentMeter ?? current?.recentMeter ?? 0
            nextPatch = { ...nextPatch, quantity: meterUsage(recentMeter, previousMeter) }
          }
          return {
            errors: {},
            draft: {
              ...s.draft,
              lineItems: s.draft.lineItems.map((item) =>
                item.id === id ? { ...item, ...nextPatch } : item,
              ),
            },
          }
        }),
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
          // Backfill fields added after this invoice was saved (e.g. an
          // older record predating utility rates) so inputs never mount
          // with an undefined value.
          return { draft: { ...makeDraft(), ...rest } }
        }),
      deleteInvoice: (id) =>
        set((s) => ({
          savedInvoices: s.savedInvoices.filter((i) => i.id !== id),
        })),
    }),
    {
      name: "rentledger-store",
      partialize: (s) => ({ draft: s.draft, savedInvoices: s.savedInvoices }),
      // Backfill any fields added after a user's localStorage snapshot was
      // written (e.g. utility rates) so number inputs never mount with an
      // undefined value — Base UI locks an input's controlled/uncontrolled
      // mode on first render, so an undefined value here can't self-heal.
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<InvoiceState> | undefined
        return {
          ...current,
          ...persistedState,
          draft: { ...makeDraft(), ...persistedState?.draft },
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

export const UNIT_OPTIONS: Unit[] = ["m³", "kW", "$", "unit", "month"]
