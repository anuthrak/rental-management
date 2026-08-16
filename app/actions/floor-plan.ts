"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export type GridPositionUpdate = {
  roomId: string
  gridRow: number | null
  gridCol: number | null
}

// Called once per drag-drop (not per pointer move) with every room whose
// cell changed — a drop onto an occupied cell swaps two rooms, so this can
// be a batch of up to 2 updates. Demo/guest sessions have no userId and the
// Custom Layout view never calls this for them (it stays client-local);
// scoping every update to the caller's own rooms here is what stops a
// crafted request from moving someone else's rooms.
export async function updateRoomGridPositions(updates: GridPositionUpdate[]) {
  const session = await getSession()
  if (!session) return

  await prisma.$transaction(
    updates.map((u) =>
      prisma.room.updateMany({
        where: { id: u.roomId, userId: session.userId },
        data: { gridRow: u.gridRow, gridCol: u.gridCol },
      }),
    ),
  )
  revalidatePath("/")
}

// Declares how many floors the account's floor chips should offer, ahead of
// any room actually existing on them. Never destructive — floor chips are
// the union of this count and whatever floors real rooms occupy, so a lower
// count here can't hide a floor with rooms on it.
export async function setFloorCount(count: number) {
  const session = await getSession()
  if (!session) return

  await prisma.user.update({ where: { id: session.userId }, data: { floorCount: count } })
  revalidatePath("/")
}

export async function setFloorPlanDimensions(floor: number, rows: number, cols: number) {
  const session = await getSession()
  if (!session) return

  await prisma.floorPlanLayout.upsert({
    where: { userId_floor: { userId: session.userId, floor } },
    create: { userId: session.userId, floor, rows, cols },
    update: { rows, cols },
  })
  revalidatePath("/")
}

// Clears every room's grid position on this floor and removes the custom
// dimensions row, matching the "Reset to Default Grid" label — the UI falls
// back to the default size once this row is gone.
export async function resetFloorPlanLayout(floor: number) {
  const session = await getSession()
  if (!session) return

  await prisma.$transaction([
    prisma.room.updateMany({
      where: { userId: session.userId, floor },
      data: { gridRow: null, gridCol: null },
    }),
    prisma.floorPlanLayout.deleteMany({
      where: { userId: session.userId, floor },
    }),
  ])
  revalidatePath("/")
}
