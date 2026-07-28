"use client"

import { create } from "zustand"

export type TutorialPageId = "dashboard" | "invoice" | "payments"

interface TutorialState {
  openPageId: TutorialPageId | null
  open: (pageId: TutorialPageId) => void
  close: () => void
}

export const useTutorialStore = create<TutorialState>()((set) => ({
  openPageId: null,
  open: (pageId) => set({ openPageId: pageId }),
  close: () => set({ openPageId: null }),
}))
