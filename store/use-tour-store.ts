"use client"

import { create } from "zustand"

interface TourState {
  active: boolean
  open: () => void
  close: () => void
}

export const useTourStore = create<TourState>()((set) => ({
  active: false,
  open: () => set({ active: true }),
  close: () => set({ active: false }),
}))
