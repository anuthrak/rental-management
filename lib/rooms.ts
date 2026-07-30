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
