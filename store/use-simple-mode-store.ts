"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SimpleModeState {
  simpleMode: boolean
  toggle: () => void
  setSimpleMode: (value: boolean) => void
}

export const useSimpleModeStore = create<SimpleModeState>()(
  persist(
    (set) => ({
      simpleMode: false,
      toggle: () => set((s) => ({ simpleMode: !s.simpleMode })),
      setSimpleMode: (value) => set({ simpleMode: value }),
    }),
    { name: "rentledger-simple-mode" },
  ),
)
