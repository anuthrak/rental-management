"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface GridCell {
  row: number
  col: number
}

export interface FloorPlanDimensions {
  rows: number
  cols: number
}

const DEFAULT_DIMENSIONS: FloorPlanDimensions = { rows: 4, cols: 10 }

interface FloorPlanLayoutState {
  dimensions: FloorPlanDimensions
  positions: Record<string, GridCell>
  locked: boolean
  setDimensions: (dimensions: FloorPlanDimensions) => void
  setPosition: (roomId: string, cell: GridCell) => void
  unassignRoom: (roomId: string) => void
  resetLayout: () => void
  toggleLocked: () => void
  setLocked: (locked: boolean) => void
}

function cellKey(cell: GridCell): string {
  return `${cell.row}:${cell.col}`
}

export const useFloorPlanLayoutStore = create<FloorPlanLayoutState>()(
  persist(
    (set) => ({
      dimensions: DEFAULT_DIMENSIONS,
      positions: {},
      locked: true,

      setDimensions: (dimensions) => set({ dimensions }),

      // Moving a room onto an occupied cell swaps the two rooms; moving a
      // room from the unassigned tray (no prior cell) onto an occupied cell
      // instead bumps the occupant back to the tray, since there's no
      // "old position" of the dragged room to hand it.
      setPosition: (roomId, cell) =>
        set((state) => {
          const positions = { ...state.positions }
          const previousCell = positions[roomId]
          const occupantId = Object.keys(positions).find(
            (id) => id !== roomId && cellKey(positions[id]) === cellKey(cell),
          )

          if (occupantId) {
            if (previousCell) {
              positions[occupantId] = previousCell
            } else {
              delete positions[occupantId]
            }
          }

          positions[roomId] = cell
          return { positions }
        }),

      unassignRoom: (roomId) =>
        set((state) => {
          const positions = { ...state.positions }
          delete positions[roomId]
          return { positions }
        }),

      resetLayout: () => set({ positions: {} }),

      toggleLocked: () => set((state) => ({ locked: !state.locked })),
      setLocked: (locked) => set({ locked }),
    }),
    { name: "rentledger-floor-plan-layout" },
  ),
)
