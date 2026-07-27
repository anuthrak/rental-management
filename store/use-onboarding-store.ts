"use client"

import { create } from "zustand"

export type PricingModel = "standard" | "custom"
export type SecurityDepositStatus = "HELD" | "REFUNDED" | "APPLIED_TO_RENT"
export type OnboardingCurrency = "USD" | "KHR"

export type OnboardingRoom = {
  id: string
  roomNumber: string
  targetPrice: number
}

export type OnboardingTenant = {
  id: string
  roomId: string
  fullName: string
  phone: string
  email: string
  nationalId: string
  leaseStartDate: string
  leaseEndDate: string
  agreedRent: number
  securityDeposit: number
  securityDepositStatus: SecurityDepositStatus
  waterMeterStart: number
  electricMeterStart: number
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const DEFAULT_STANDARD_ROOM_COUNT = 20
export const DEFAULT_STANDARD_BASE_RATE = 800
export const DEFAULT_WATER_RATE = 0.5
export const DEFAULT_ELECTRIC_RATE = 0.25
export const DEFAULT_INVOICE_NOTE_TEMPLATE = [
  "Payment is due within 7 days of the invoice date.",
  "Late payments may incur an additional fee.",
  "Thank you for being a valued tenant.",
].join("\n")

export function createTenantDraft(roomId: string, agreedRent = 0): OnboardingTenant {
  return {
    id: uid(),
    roomId,
    fullName: "",
    phone: "",
    email: "",
    nationalId: "",
    leaseStartDate: today(),
    leaseEndDate: "",
    agreedRent,
    securityDeposit: 0,
    securityDepositStatus: "HELD",
    waterMeterStart: 0,
    electricMeterStart: 0,
  }
}

// The definitive room list for either pricing mode — standard rooms are
// derived on the fly from count/rate rather than materialized, so there's
// nothing to keep in sync when either input changes.
export function resolveRooms(state: {
  pricingModel: PricingModel
  standardRoomCount: number
  standardBaseRate: number
  customRooms: OnboardingRoom[]
}): OnboardingRoom[] {
  if (state.pricingModel === "standard") {
    const count = Math.max(0, Math.floor(state.standardRoomCount) || 0)
    return Array.from({ length: count }, (_, i) => ({
      id: `standard-${i}`,
      roomNumber: `Room ${101 + i}`,
      targetPrice: state.standardBaseRate,
    }))
  }
  return state.customRooms
}

interface OnboardingState {
  step: number
  propertyName: string
  pricingModel: PricingModel
  standardRoomCount: number
  standardBaseRate: number
  customRooms: OnboardingRoom[]
  tenants: OnboardingTenant[]
  currency: OnboardingCurrency
  waterRate: number
  electricRate: number
  invoiceNoteTemplate: string

  setStep: (step: number) => void
  setPropertyName: (name: string) => void
  setPricingModel: (model: PricingModel) => void
  setStandardRoomCount: (count: number) => void
  setStandardBaseRate: (rate: number) => void
  addCustomRoom: () => void
  updateCustomRoom: (id: string, patch: Partial<Omit<OnboardingRoom, "id">>) => void
  removeCustomRoom: (id: string) => void
  addTenant: (tenant: OnboardingTenant) => void
  updateTenant: (id: string, patch: Partial<Omit<OnboardingTenant, "id">>) => void
  removeTenant: (id: string) => void
  setCurrency: (currency: OnboardingCurrency) => void
  setWaterRate: (rate: number) => void
  setElectricRate: (rate: number) => void
  setInvoiceNoteTemplate: (note: string) => void
  reset: () => void
}

const initialState = {
  step: 1,
  propertyName: "",
  pricingModel: "standard" as PricingModel,
  standardRoomCount: DEFAULT_STANDARD_ROOM_COUNT,
  standardBaseRate: DEFAULT_STANDARD_BASE_RATE,
  customRooms: [] as OnboardingRoom[],
  tenants: [] as OnboardingTenant[],
  currency: "USD" as OnboardingCurrency,
  waterRate: DEFAULT_WATER_RATE,
  electricRate: DEFAULT_ELECTRIC_RATE,
  invoiceNoteTemplate: DEFAULT_INVOICE_NOTE_TEMPLATE,
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setPropertyName: (propertyName) => set({ propertyName }),
  setPricingModel: (pricingModel) => set({ pricingModel }),

  setStandardRoomCount: (count) =>
    set((s) => {
      const standardRoomCount = Math.max(0, Math.floor(count) || 0)
      const validIds = new Set(
        Array.from({ length: standardRoomCount }, (_, i) => `standard-${i}`),
      )
      return {
        standardRoomCount,
        // Drop any tenant assigned to a room this shrink just removed.
        tenants:
          s.pricingModel === "standard"
            ? s.tenants.filter((t) => validIds.has(t.roomId))
            : s.tenants,
      }
    }),

  setStandardBaseRate: (rate) => set({ standardBaseRate: Math.max(0, rate || 0) }),

  addCustomRoom: () =>
    set((s) => ({
      customRooms: [...s.customRooms, { id: uid(), roomNumber: "", targetPrice: 0 }],
    })),

  updateCustomRoom: (id, patch) =>
    set((s) => ({
      customRooms: s.customRooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  removeCustomRoom: (id) =>
    set((s) => ({
      customRooms: s.customRooms.filter((r) => r.id !== id),
      tenants: s.tenants.filter((t) => t.roomId !== id),
    })),

  addTenant: (tenant) => set((s) => ({ tenants: [...s.tenants, tenant] })),

  updateTenant: (id, patch) =>
    set((s) => ({
      tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  removeTenant: (id) => set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) })),

  setCurrency: (currency) => set({ currency }),
  setWaterRate: (rate) => set({ waterRate: Math.max(0, rate || 0) }),
  setElectricRate: (rate) => set({ electricRate: Math.max(0, rate || 0) }),
  setInvoiceNoteTemplate: (invoiceNoteTemplate) => set({ invoiceNoteTemplate }),

  reset: () => set(initialState),
}))
