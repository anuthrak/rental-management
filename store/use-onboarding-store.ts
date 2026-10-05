"use client"

import { create } from "zustand"

import { DEFAULT_INVOICE_NOTES } from "@/lib/invoice-notes"
import { MAX_FLOOR_COUNT, MIN_FLOOR_COUNT } from "@/lib/rooms"
import type { Language } from "@/lib/types"

export type PricingModel = "standard" | "custom"
export type SecurityDepositStatus = "HELD" | "REFUNDED" | "APPLIED_TO_RENT"
export type OnboardingCurrency = "USD" | "KHR"

export type OnboardingRoom = {
  id: string
  roomNumber: string
  targetPrice: number
  waterMeterStart: number
  electricMeterStart: number
  // Explicit floor, replacing reliance on deriveFloorFromRoomNumber at
  // submit time. For the standard pricing model this is stamped by
  // resolveRooms from roomsPerFloor; for custom rooms it's set by the
  // per-room floor <Select> on Step 1.
  floor: number
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
  }
}

// The definitive room list for either pricing mode — standard rooms are
// derived on the fly from roomsPerFloor/rate rather than materialized, so
// there's nothing to keep in sync when either input changes. Every derived
// room is stamped with its floor using the existing `Room {100*floor + N}`
// numbering convention, keeping deriveFloorFromRoomNumber's inverse
// relationship intact even though floor is now assigned explicitly.
export function resolveRooms(state: {
  pricingModel: PricingModel
  roomsPerFloor: number[]
  standardBaseRate: number
  standardWaterMeterStart: number
  standardElectricMeterStart: number
  customRooms: OnboardingRoom[]
}): OnboardingRoom[] {
  if (state.pricingModel === "standard") {
    const rooms: OnboardingRoom[] = []
    state.roomsPerFloor.forEach((countOnFloor, floorIdx) => {
      const floor = floorIdx + 1
      const count = Math.max(0, Math.floor(countOnFloor) || 0)
      for (let n = 0; n < count; n++) {
        rooms.push({
          id: `standard-${floor}-${n}`,
          roomNumber: `Room ${floor * 100 + n + 1}`,
          targetPrice: state.standardBaseRate,
          waterMeterStart: state.standardWaterMeterStart,
          electricMeterStart: state.standardElectricMeterStart,
          floor,
        })
      }
    })
    return rooms
  }
  return state.customRooms
}

interface OnboardingState {
  step: number
  propertyName: string
  pricingModel: PricingModel
  // How many floors the property has, and how many rooms are declared per
  // floor (index i = floor i+1). Drives the Floors & Capacity step; for the
  // standard pricing model this *is* the room count/floor assignment (see
  // resolveRooms), for custom it's just a per-floor ceiling.
  floorCount: number
  roomsPerFloor: number[]
  standardBaseRate: number
  standardWaterMeterStart: number
  standardElectricMeterStart: number
  customRooms: OnboardingRoom[]
  tenants: OnboardingTenant[]
  currency: OnboardingCurrency
  waterRate: number
  electricRate: number
  invoiceNoteTemplate: string
  // False until the user edits the note template by hand — lets the
  // language step keep swapping in the localized default T&Cs without
  // clobbering a customization once one exists.
  invoiceNoteTouched: boolean

  setStep: (step: number) => void
  setPropertyName: (name: string) => void
  setPricingModel: (model: PricingModel) => void
  setFloorCount: (count: number) => void
  setRoomsPerFloor: (floorIndex: number, count: number) => void
  setStandardBaseRate: (rate: number) => void
  setStandardWaterMeterStart: (value: number) => void
  setStandardElectricMeterStart: (value: number) => void
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
  syncInvoiceNoteLanguage: (language: Language) => void
  reset: () => void
}

const initialState = {
  step: 0,
  propertyName: "",
  pricingModel: "standard" as PricingModel,
  // Default: all 20 default rooms on floor 1 — preserves the exact
  // single-floor UX for anyone who never touches the new Floors step.
  floorCount: 1,
  roomsPerFloor: [DEFAULT_STANDARD_ROOM_COUNT] as number[],
  standardBaseRate: DEFAULT_STANDARD_BASE_RATE,
  standardWaterMeterStart: 0,
  standardElectricMeterStart: 0,
  customRooms: [] as OnboardingRoom[],
  tenants: [] as OnboardingTenant[],
  currency: "USD" as OnboardingCurrency,
  waterRate: DEFAULT_WATER_RATE,
  electricRate: DEFAULT_ELECTRIC_RATE,
  invoiceNoteTemplate: DEFAULT_INVOICE_NOTES.en,
  invoiceNoteTouched: false,
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setPropertyName: (propertyName) => set({ propertyName }),
  setPricingModel: (pricingModel) => set({ pricingModel }),

  // Resizes roomsPerFloor to match (extra floors default to 0, dropped
  // floors' counts are discarded) and clamps every customRoom's floor down
  // to the new ceiling — same "shrink prunes what no longer fits" pattern
  // the old setStandardRoomCount used for tenants.
  setFloorCount: (count) =>
    set((s) => {
      const floorCount = Math.max(MIN_FLOOR_COUNT, Math.min(MAX_FLOOR_COUNT, Math.floor(count) || 1))
      const roomsPerFloor = Array.from({ length: floorCount }, (_, i) => s.roomsPerFloor[i] ?? 0)
      const customRooms = s.customRooms.map((r) => ({ ...r, floor: Math.min(r.floor, floorCount) }))
      return { floorCount, roomsPerFloor, customRooms }
    }),

  setRoomsPerFloor: (floorIndex, count) =>
    set((s) => {
      if (floorIndex < 0 || floorIndex >= s.roomsPerFloor.length) return s
      const roomsPerFloor = [...s.roomsPerFloor]
      roomsPerFloor[floorIndex] = Math.max(0, Math.floor(count) || 0)
      // Drop any tenant assigned to a standard room this shrink just removed.
      let tenants = s.tenants
      if (s.pricingModel === "standard") {
        const validIds = new Set<string>()
        roomsPerFloor.forEach((countOnFloor, idx) => {
          const floor = idx + 1
          const c = Math.max(0, Math.floor(countOnFloor) || 0)
          for (let n = 0; n < c; n++) validIds.add(`standard-${floor}-${n}`)
        })
        tenants = s.tenants.filter((t) => validIds.has(t.roomId))
      }
      return { roomsPerFloor, tenants }
    }),

  setStandardBaseRate: (rate) => set({ standardBaseRate: Math.max(0, rate || 0) }),
  setStandardWaterMeterStart: (value) => set({ standardWaterMeterStart: Math.max(0, value || 0) }),
  setStandardElectricMeterStart: (value) => set({ standardElectricMeterStart: Math.max(0, value || 0) }),

  addCustomRoom: () =>
    set((s) => ({
      customRooms: [
        ...s.customRooms,
        {
          id: uid(),
          roomNumber: "",
          targetPrice: 0,
          waterMeterStart: 0,
          electricMeterStart: 0,
          floor: 1,
        },
      ],
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
  setInvoiceNoteTemplate: (invoiceNoteTemplate) =>
    set({ invoiceNoteTemplate, invoiceNoteTouched: true }),

  syncInvoiceNoteLanguage: (language) =>
    set((s) =>
      s.invoiceNoteTouched ? s : { invoiceNoteTemplate: DEFAULT_INVOICE_NOTES[language] },
    ),

  reset: () => set(initialState),
}))
