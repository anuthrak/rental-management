// Shared floor-count bounds — used both to bound the account-wide
// `floorCount` (Number of floors) and to bound a single room's `floor`
// value. Lives here (not in a "use client" component) so both server
// actions (app/actions/dashboard.ts) and client components can import it.
export const MIN_FLOOR_COUNT = 1
export const MAX_FLOOR_COUNT = 50

// Shared default grid size for a floor with no FloorPlanLayout row yet —
// the single source of truth for both the client-only
// useFloorPlanLayoutStore's DEFAULT_DIMENSIONS and any server-side capacity
// derivation (getFloorCapacity in lib/db/queries.ts).
export const DEFAULT_FLOOR_ROWS = 4
export const DEFAULT_FLOOR_COLS = 10

// Bounds for a single floor's Custom Layout grid (rows or cols individually),
// shared by GridLayoutSetupModal's client-side input validation and any
// server-side grid derivation (e.g. onboarding's per-floor capacity).
export const MIN_GRID_DIMENSION = 1
export const MAX_GRID_DIMENSION = 20

// Derives a headroom-padded grid size from a declared/expected room count —
// used by onboarding (Part B) to turn "N rooms on this floor" into a
// FloorPlanLayout row without requiring the landlord to think in rows/cols.
// roomCount <= 0 falls back to the plain default grid rather than a
// degenerate near-empty one.
export function deriveGridForRoomCount(roomCount: number): { rows: number; cols: number } {
  if (roomCount <= 0) return { rows: DEFAULT_FLOOR_ROWS, cols: DEFAULT_FLOOR_COLS }
  const cols = Math.min(MAX_GRID_DIMENSION, Math.max(1, Math.ceil(Math.sqrt(roomCount))))
  const rows = Math.min(MAX_GRID_DIMENSION, Math.ceil(roomCount / cols) + 1) // +1 = headroom
  return { rows, cols }
}

// Derives a floor number from a room's numeric suffix (e.g. "Room 101" -> 1,
// "Room 205" -> 2, "301" -> 3) so newly created rooms land on a sensible
// floor without requiring a dedicated floor input. Falls back to 1 when no
// 3+ digit suffix is present.
export function deriveFloorFromRoomNumber(roomNumber: string): number {
  const match = roomNumber.match(/(\d{3,})\D*$/)
  if (!match) return 1
  const floor = Math.floor(Number(match[1]) / 100)
  return floor >= 1 ? floor : 1
}

// Ground floor is conventionally "GF" rather than "Floor 0"; upper floors
// use the common "F1"/"F2" shorthand instead of the more verbose "Floor N".
export function formatFloorLabel(floor: number): string {
  return floor === 0 ? "GF" : `F${floor}`
}
