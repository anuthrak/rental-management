import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

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
  console.log("Seeding 40 rooms...")
  // userId is intentionally left unset (NULL) on every room/tenant/lease/
  // invoice created below: this is the shared public demo dataset, visible
  // to anyone browsing in Demo Mode. Real accounts get their own rows with
  // userId set, scoped via getScopedData() in lib/db/queries.ts.

  for (let i = 1; i <= 40; i++) {
    const roomNumber = `Room ${100 + i}`
    const targetPrice = randomPrice()
    const status = pickStatus()

    const room = await prisma.room.create({
      data: { roomNumber, targetPrice, status },
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

  const [rooms, tenants, leases, invoices] = await Promise.all([
    prisma.room.count(),
    prisma.tenant.count(),
    prisma.lease.count(),
    prisma.invoice.count(),
  ])
  console.log(`Done. rooms=${rooms} tenants=${tenants} leases=${leases} invoices=${invoices}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
