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

// A room whose cell changed as a side effect of a store mutation — a drop
// onto an occupied cell can move two rooms at once (the dragged room and
// whichever room it displaced). Callers use this to know exactly what to
// persist to the server.
export type GridPositionDiff = { roomId: string; cell: GridCell | null }

export const DEFAULT_DIMENSIONS: FloorPlanDimensions = { rows: 4, cols: 10 }
export const DEFAULT_FLOOR_COUNT = 1

interface FloorPlanLayoutState {
  // Keyed by floor number — a multi-floor property gets one independent
  // coordinate space per floor, so placing a room at (0,0) on Floor 2 can
  // never collide with or evict a room already at (0,0) on Floor 1.
  dimensionsByFloor: Record<number, FloorPlanDimensions>
  positionsByFloor: Record<number, Record<string, GridCell>>
  // How many floor chips to offer beyond whatever floors real rooms already
  // occupy. undefined means "not yet hydrated from the server" for a signed
  // in account — read via `floorCount ?? DEFAULT_FLOOR_COUNT`, the same
  // undefined-as-hydration-signal pattern positionsByFloor[floor] uses.
  floorCount: number | undefined
  locked: boolean
  // Which account (or "guest") this cached layout belongs to. localStorage
  // is shared by whoever uses this browser, so on a shared device a second
  // account logging in would otherwise inherit the first account's cached
  // grid until every floor happened to get re-hydrated.
  owner: string | null

  // Wipes cached layout state the first time it sees a different owner
  // than last time (a different account, or guest vs. a real account) —
  // otherwise a no-op. Call this before hydrateFloor/hydrateFloorCount.
  syncOwner: (owner: string | null) => void
  setFloorCount: (count: number) => void
  hydrateFloorCount: (count: number) => void
  setDimensions: (floor: number, dimensions: FloorPlanDimensions) => void
  setPosition: (floor: number, roomId: string, cell: GridCell) => GridPositionDiff[]
  // Bulk-assigns rooms to cells that are assumed free (e.g. auto-arrange
  // filling empty slots) — unlike setPosition, this never swaps an
  // occupant out, so it's only safe to call with cells you know are empty.
  setPositions: (floor: number, assignments: GridPositionDiff[]) => GridPositionDiff[]
  unassignRoom: (floor: number, roomId: string) => GridPositionDiff[]
  resetLayout: (floor: number) => void
  pruneFloor: (floor: number, knownRoomIds: Set<string>) => void
  hydrateFloor: (
    floor: number,
    data: { dimensions?: FloorPlanDimensions; positions: Record<string, GridCell> },
  ) => void
  toggleLocked: () => void
  setLocked: (locked: boolean) => void
}

function cellKey(cell: GridCell): string {
  return `${cell.row}:${cell.col}`
}

export const useFloorPlanLayoutStore = create<FloorPlanLayoutState>()(
  persist(
    (set) => ({
      dimensionsByFloor: {},
      positionsByFloor: {},
      floorCount: undefined,
      locked: true,
      owner: null,

      syncOwner: (owner) =>
        set((state) =>
          state.owner === owner
            ? state
            : { owner, dimensionsByFloor: {}, positionsByFloor: {}, floorCount: undefined },
        ),

      setFloorCount: (count) => set({ floorCount: count }),

      // Seeds floorCount from the server once — same "only overwrite while
      // still undefined" contract as hydrateFloor, so a later local edit
      // that hasn't round-tripped yet never gets clobbered by re-hydration.
      hydrateFloorCount: (count) =>
        set((state) => (state.floorCount === undefined ? { floorCount: count } : state)),

      setDimensions: (floor, dimensions) =>
        set((state) => ({
          dimensionsByFloor: { ...state.dimensionsByFloor, [floor]: dimensions },
        })),

      // Moving a room onto an occupied cell swaps the two rooms; moving a
      // room from the unassigned tray (no prior cell) onto an occupied cell
      // instead bumps the occupant back to the tray, since there's no
      // "old position" of the dragged room to hand it.
      setPosition: (floor, roomId, cell) => {
        const diffs: GridPositionDiff[] = []
        set((state) => {
          const positions = { ...(state.positionsByFloor[floor] ?? {}) }
          const previousCell = positions[roomId]
          const occupantId = Object.keys(positions).find(
            (id) => id !== roomId && cellKey(positions[id]) === cellKey(cell),
          )

          if (occupantId) {
            if (previousCell) {
              positions[occupantId] = previousCell
              diffs.push({ roomId: occupantId, cell: previousCell })
            } else {
              delete positions[occupantId]
              diffs.push({ roomId: occupantId, cell: null })
            }
          }

          positions[roomId] = cell
          diffs.push({ roomId, cell })

          return { positionsByFloor: { ...state.positionsByFloor, [floor]: positions } }
        })
        return diffs
      },

      setPositions: (floor, assignments) => {
        set((state) => {
          const positions = { ...(state.positionsByFloor[floor] ?? {}) }
          for (const { roomId, cell } of assignments) {
            if (cell) positions[roomId] = cell
            else delete positions[roomId]
          }
          return { positionsByFloor: { ...state.positionsByFloor, [floor]: positions } }
        })
        return assignments
      },

      unassignRoom: (floor, roomId) => {
        set((state) => {
          const positions = { ...(state.positionsByFloor[floor] ?? {}) }
          delete positions[roomId]
          return { positionsByFloor: { ...state.positionsByFloor, [floor]: positions } }
        })
        return [{ roomId, cell: null }]
      },

      // Clears both positions and dimensions for the floor, matching the
      // "Reset to Default Grid" label — a bare positions-only clear would
      // leave a previously-enlarged grid size in place.
      resetLayout: (floor) =>
        set((state) => {
          const dimensionsByFloor = { ...state.dimensionsByFloor }
          delete dimensionsByFloor[floor]
          const positionsByFloor = { ...state.positionsByFloor }
          delete positionsByFloor[floor]
          return { dimensionsByFloor, positionsByFloor }
        }),

      // Drops position entries for rooms that no longer exist (deleted, or
      // never valid) so the persisted blob doesn't grow forever.
      pruneFloor: (floor, knownRoomIds) =>
        set((state) => {
          const existing = state.positionsByFloor[floor]
          if (!existing) return state
          const entries = Object.entries(existing).filter(([roomId]) => knownRoomIds.has(roomId))
          if (entries.length === Object.keys(existing).length) return state
          return { positionsByFloor: { ...state.positionsByFloor, [floor]: Object.fromEntries(entries) } }
        }),

      // Seeds a floor's state from the server (authenticated accounts
      // only — demo/guest sessions never call this and stay purely
      // client-local). Overwrites whatever was there, so callers should
      // only do this once per floor visit, not on every render.
      hydrateFloor: (floor, data) =>
        set((state) => ({
          dimensionsByFloor: data.dimensions
            ? { ...state.dimensionsByFloor, [floor]: data.dimensions }
            : state.dimensionsByFloor,
          positionsByFloor: { ...state.positionsByFloor, [floor]: data.positions },
        })),

      toggleLocked: () => set((state) => ({ locked: !state.locked })),
      setLocked: (locked) => set({ locked }),
    }),
    {
      name: "rentledger-floor-plan-layout",
      version: 1,
      // v0 stored a single flat, non-floor-scoped dimensions/positions pair
      // with no record of which floor it belonged to — there's no safe way
      // to migrate that data, so a version bump just starts fresh instead
      // of guessing wrong and scrambling an existing layout.
      migrate: () => ({
        dimensionsByFloor: {},
        positionsByFloor: {},
        floorCount: undefined,
        locked: true,
        owner: null,
      }),
    },
  ),
)
