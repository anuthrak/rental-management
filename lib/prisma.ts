import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Vercel's build step imports this module while collecting route metadata,
// before any project env vars are guaranteed to be set. Fall back to the
// local SQLite file so `next build` never crashes on a missing
// DATABASE_URL — actual requests still need a real DATABASE_URL to work.
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./prisma/dev.db" })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
