"use client"

import { create } from "zustand"

interface GuidedTourState {
  isOpen: boolean
  stepIndex: number
  start: () => void
  close: () => void
  next: (stepCount: number) => void
  back: () => void
}

export const useGuidedTourStore = create<GuidedTourState>()((set) => ({
  isOpen: false,
  stepIndex: 0,
  start: () => set({ isOpen: true, stepIndex: 0 }),
  close: () => set({ isOpen: false }),
  next: (stepCount) =>
    set((s) => {
      if (s.stepIndex >= stepCount - 1) return { isOpen: false }
      return { stepIndex: s.stepIndex + 1 }
    }),
  back: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
}))
