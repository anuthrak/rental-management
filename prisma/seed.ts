import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

import { deriveFloorFromRoomNumber } from "../lib/rooms"
import { hashPassword } from "../lib/auth/password"

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type Wing = "left_wing" | "top_wing" | "right_wing" | "bottom_facade"

interface SketchRoom {
  roomNumber: string
  wing: Wing
  position: number
  isVip?: boolean
  stairAfter?: boolean
}

// Ground floor: left wing stack, a bottom facade row of shops, and a right
// wing whose top row (RBB/R1/R2) has no bridging top-wing room of its own
// (unlike F1/F2). "R2" collides with the left wing's own "R2" from the
// source sketch — renamed R2B to keep room numbers unique per account.
const GF_ROOMS: SketchRoom[] = [
  { roomNumber: "R5", wing: "left_wing", position: 0 },
  { roomNumber: "R56", wing: "left_wing", position: 1 },
  { roomNumber: "R28", wing: "left_wing", position: 2, stairAfter: true },
  { roomNumber: "R2", wing: "left_wing", position: 3 },
  { roomNumber: "Shop I", wing: "bottom_facade", position: 0, isVip: true },
  { roomNumber: "Shop II", wing: "bottom_facade", position: 1 },
  { roomNumber: "Shop III", wing: "bottom_facade", position: 2 },
  { roomNumber: "RBB", wing: "right_wing", position: 0 },
  { roomNumber: "R1", wing: "right_wing", position: 1 },
  { roomNumber: "R2B", wing: "right_wing", position: 2 },
  { roomNumber: "R1156", wing: "right_wing", position: 3 },
  { roomNumber: "R ភ្នំពេញ", wing: "right_wing", position: 4 },
  { roomNumber: "R ភ្នំទ្រព្យ", wing: "right_wing", position: 5 },
  { roomNumber: "R45", wing: "right_wing", position: 6 },
  { roomNumber: "R36", wing: "right_wing", position: 7 },
]

// Floor 1: R9 bridges to the top-wing room "R ម៉ាត", which in turn connects
// down into the right wing. "Khmer R2/R3/R4" collide with the same labels on
// F2 — suffixed with the floor code for both floors.
const F1_ROOMS: SketchRoom[] = [
  { roomNumber: "R9", wing: "left_wing", position: 0 },
  { roomNumber: "R9 VIP", wing: "left_wing", position: 1, isVip: true },
  { roomNumber: "R8", wing: "left_wing", position: 2, stairAfter: true },
  { roomNumber: "R18", wing: "left_wing", position: 3 },
  { roomNumber: "R10", wing: "left_wing", position: 4 },
  { roomNumber: "R6", wing: "left_wing", position: 5 },
  { roomNumber: "R ម៉ាត", wing: "top_wing", position: 0 },
  { roomNumber: "R សុខសប្បាយ", wing: "right_wing", position: 0 },
  { roomNumber: "Khmer R2 (F1)", wing: "right_wing", position: 1 },
  { roomNumber: "Khmer R3 (F1)", wing: "right_wing", position: 2 },
  { roomNumber: "Khmer R4 (F1)", wing: "right_wing", position: 3 },
  { roomNumber: "R1165 VIP", wing: "right_wing", position: 4, isVip: true },
  { roomNumber: "Shop II F1", wing: "right_wing", position: 5 },
]

// Floor 2: same U-shape as F1, bridged by "Top Center Room".
const F2_ROOMS: SketchRoom[] = [
  { roomNumber: "R19", wing: "left_wing", position: 0 },
  { roomNumber: "R16", wing: "left_wing", position: 1 },
  { roomNumber: "R15", wing: "left_wing", position: 2, stairAfter: true },
  { roomNumber: "R20", wing: "left_wing", position: 3 },
  { roomNumber: "R12", wing: "left_wing", position: 4 },
  { roomNumber: "R11", wing: "left_wing", position: 5 },
  { roomNumber: "Top Center Room", wing: "top_wing", position: 0 },
  { roomNumber: "Khmer R1", wing: "right_wing", position: 0 },
  { roomNumber: "Khmer R2 (F2)", wing: "right_wing", position: 1 },
  { roomNumber: "Khmer R3 (F2)", wing: "right_wing", position: 2 },
  { roomNumber: "Khmer R4 (F2)", wing: "right_wing", position: 3 },
  { roomNumber: "Khmer R5", wing: "right_wing", position: 4 },
  { roomNumber: "R69 VIP", wing: "right_wing", position: 5, isVip: true },
]

async function seedSocheattaProperty() {
  const email = "socheattameas@gmail.com"
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await hashPassword("ChangeMe123!"),
      name: "Socheatta Meas",
      businessName: "Socheatta's Property",
    },
  })

  const existingCount = await prisma.room.count({ where: { userId: user.id } })
  if (existingCount > 0) {
    console.log(`Socheatta's property already seeded (${existingCount} rooms) — skipping.`)
    return
  }

  const floors: { floor: number; rooms: SketchRoom[] }[] = [
    { floor: 0, rooms: GF_ROOMS },
    { floor: 1, rooms: F1_ROOMS },
    { floor: 2, rooms: F2_ROOMS },
  ]

  for (const { floor, rooms } of floors) {
    for (const room of rooms) {
      const targetPrice = room.roomNumber.startsWith("Shop") ? 250 : room.isVip ? 200 : 120
      await prisma.room.create({
        data: {
          roomNumber: room.roomNumber,
          floor,
          wing: room.wing,
          position: room.position,
          isVip: room.isVip ?? false,
          stairAfter: room.stairAfter ?? false,
          targetPrice,
          status: "VACANT",
          userId: user.id,
        },
      })
    }
  }

  const total = GF_ROOMS.length + F1_ROOMS.length + F2_ROOMS.length
  console.log(`Seeded Socheatta's property (${email}): ${total} rooms across 3 floors (GF/F1/F2).`)
}

const FIRST_NAMES = [
  "James", "Mary", "Sokha", "Sopheak", "David", "Linda", "Chan", "Bopha",
  "Michael", "Sarah", "Vichea", "Dara", "Robert", "Jennifer", "Ratha", "Kunthea",
]
const LAST_NAMES = [
  "Chan", "Nguyen", "Smith", "Kim", "Sok", "Meas", "Johnson", "Sary",
  "Lee", "Pich", "Brown", "Vong", "Davis", "Heng", "Wilson", "Chea",
]

function randomTenantName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return `${first} ${last}`
}

function randomPhone(): string {
  return `+855 ${Math.floor(10 + Math.random() * 90)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`
}

function randomPrice(): number {
  // Realistic variable pricing between $150 and $420, rounded to the nearest $5.
  return Math.round((150 + Math.random() * 270) / 5) * 5
}

function pickStatus(): "OCCUPIED" | "VACANT" | "MAINTENANCE" {
  const roll = Math.random()
  if (roll < 0.75) return "OCCUPIED"
  if (roll < 0.93) return "VACANT"
  return "MAINTENANCE"
}

function monthsAgo(n: number, day = 1): Date {
  const d = new Date()
  d.setDate(day)
  d.setMonth(d.getMonth() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function main() {
  // userId is intentionally left unset (NULL) on every room/tenant/lease/
  // invoice created below: this is the shared public demo dataset, visible
  // to anyone browsing in Demo Mode. Real accounts get their own rows with
  // userId set, scoped via getScopedData() in lib/db/queries.ts.
  const existingDemoRooms = await prisma.room.count({ where: { userId: null } })
  if (existingDemoRooms > 0) {
    console.log(`Demo dataset already seeded (${existingDemoRooms} rooms) — skipping.`)
  } else {
    console.log("Seeding 40 rooms...")
    await seedDemoRooms()
  }

  await seedSocheattaProperty()

  const [rooms, tenants, leases, invoices] = await Promise.all([
    prisma.room.count(),
    prisma.tenant.count(),
    prisma.lease.count(),
    prisma.invoice.count(),
  ])
  console.log(`Done. rooms=${rooms} tenants=${tenants} leases=${leases} invoices=${invoices}`)
}

async function seedDemoRooms() {
  for (let i = 1; i <= 40; i++) {
    const roomNumber = `Room ${100 + i}`
    const targetPrice = randomPrice()
    const status = pickStatus()

    const room = await prisma.room.create({
      data: { roomNumber, floor: deriveFloorFromRoomNumber(roomNumber), targetPrice, status },
    })

    if (status !== "OCCUPIED") continue

    const agreedRent = targetPrice - (Math.random() < 0.5 ? 0 : Math.round(Math.random() * 20))
    const startDate = monthsAgo(3 + Math.floor(Math.random() * 9))

    const tenant = await prisma.tenant.create({
      data: {
        fullName: randomTenantName(),
        phone: randomPhone(),
        roomId: room.id,
      },
    })

    const lease = await prisma.lease.create({
      data: {
        roomId: room.id,
        tenantId: tenant.id,
        agreedRent,
        startDate,
        isActive: true,
      },
    })

    // Last month: paid. This month: a mix of paid / unpaid (overdue once due date has passed).
    const lastMonthDue = monthsAgo(1, 5)
    await prisma.invoice.create({
      data: {
        roomId: room.id,
        tenantId: tenant.id,
        leaseId: lease.id,
        amountDue: agreedRent,
        dueDate: lastMonthDue,
        status: "PAID",
      },
    })

    const thisMonthDue = monthsAgo(0, 5)
    await prisma.invoice.create({
      data: {
        roomId: room.id,
        tenantId: tenant.id,
        leaseId: lease.id,
        amountDue: agreedRent,
        dueDate: thisMonthDue,
        status: Math.random() < 0.55 ? "PAID" : "UNPAID",
      },
    })
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
