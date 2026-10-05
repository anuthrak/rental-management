"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SimpleModeState {
  simpleMode: boolean
  // Distinct from zustand/persist's own rehydration — tracks whether this
  // browser has ever applied the signed-in account's simpleModeDefault, so
  // it can seed the initial value exactly once without ever clobbering a
  // manual toggle made in the same tick the account value loads.
  hasHydratedFromAccount: boolean
  toggle: () => void
  setSimpleMode: (value: boolean) => void
  hydrateFromAccount: (value: boolean) => void
}

export const useSimpleModeStore = create<SimpleModeState>()(
  persist(
    (set) => ({
      simpleMode: false,
      hasHydratedFromAccount: false,
      toggle: () => set((s) => ({ simpleMode: !s.simpleMode })),
      setSimpleMode: (value) => set({ simpleMode: value }),
      // Seeds simpleMode from the account's saved default once per browser —
      // same "only overwrite while still unhydrated" contract as
      // useFloorPlanLayoutStore's hydrateFloorCount.
      hydrateFromAccount: (value) =>
        set((s) => (s.hasHydratedFromAccount ? s : { simpleMode: value, hasHydratedFromAccount: true })),
    }),
    {
      name: "rentledger-simple-mode",
      // hasHydratedFromAccount must be persisted alongside simpleMode — it's
      // the "have we ever applied the account default" signal, and if it
      // doesn't survive a reload it resets to false on every remount, which
      // makes hydrateFromAccount silently re-fire and clobber a manual
      // toggle. Same "survives reloads, only resets for a genuinely fresh
      // browser/device with empty localStorage" contract as
      // useFloorPlanLayoutStore's floorCount.
      partialize: (s) => ({ simpleMode: s.simpleMode, hasHydratedFromAccount: s.hasHydratedFromAccount }),
    },
  ),
)
