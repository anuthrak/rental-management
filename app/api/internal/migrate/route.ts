// TEMPORARY: one-off endpoint to apply pending migrations to the production
// Turso database from inside the running app, where process.env.DATABASE_URL
// is available at runtime even though it's marked Sensitive in Vercel (which
// blocks `vercel env pull`/CLI from ever reading its plaintext). Protected by
// MIGRATE_TOKEN so it can't be triggered by anyone else. Delete this route
// (and the MIGRATE_TOKEN env var) once the migration has been applied.
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@libsql/client"
import { createHash, randomUUID } from "node:crypto"

export const dynamic = "force-dynamic"

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "20260730030826_add_room_floor",
    sql: `
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "targetPrice" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("createdAt", "id", "roomNumber", "status", "targetPrice", "updatedAt", "userId") SELECT "createdAt", "id", "roomNumber", "status", "targetPrice", "updatedAt", "userId" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE INDEX "Room_userId_idx" ON "Room"("userId");
CREATE UNIQUE INDEX "Room_userId_roomNumber_key" ON "Room"("userId", "roomNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

UPDATE "Room"
SET "floor" = CASE
  WHEN INSTR("roomNumber", ' ') > 0
    AND (
      SUBSTR("roomNumber", INSTR("roomNumber", ' ') + 1) GLOB '[0-9][0-9][0-9]'
      OR SUBSTR("roomNumber", INSTR("roomNumber", ' ') + 1) GLOB '[0-9][0-9][0-9][0-9]'
    )
  THEN CAST(SUBSTR("roomNumber", INSTR("roomNumber", ' ') + 1) AS INTEGER) / 100
  WHEN "roomNumber" GLOB '[0-9][0-9][0-9]' OR "roomNumber" GLOB '[0-9][0-9][0-9][0-9]'
  THEN CAST("roomNumber" AS INTEGER) / 100
  ELSE 1
END;
`,
  },
  {
    name: "20260730033603_add_user_tour_completed",
    sql: `
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT,
    "currencyPreference" TEXT NOT NULL DEFAULT 'USD',
    "defaultWaterRate" DECIMAL NOT NULL DEFAULT 0.5,
    "defaultElectricRate" DECIMAL NOT NULL DEFAULT 0.25,
    "invoiceNoteTemplate" TEXT,
    "tourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("businessName", "createdAt", "currencyPreference", "defaultElectricRate", "defaultWaterRate", "email", "id", "invoiceNoteTemplate", "name", "passwordHash", "updatedAt") SELECT "businessName", "createdAt", "currencyPreference", "defaultElectricRate", "defaultWaterRate", "email", "id", "invoiceNoteTemplate", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
`,
  },
  {
    name: "20260730040910_add_room_floor_plan_fields",
    sql: `
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "wing" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "stairAfter" BOOLEAN NOT NULL DEFAULT false,
    "targetPrice" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("createdAt", "floor", "id", "roomNumber", "status", "targetPrice", "updatedAt", "userId") SELECT "createdAt", "floor", "id", "roomNumber", "status", "targetPrice", "updatedAt", "userId" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE INDEX "Room_userId_idx" ON "Room"("userId");
CREATE UNIQUE INDEX "Room_userId_roomNumber_key" ON "Room"("userId", "roomNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
`,
  },
]

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-migrate-token")
  if (!process.env.MIGRATE_TOKEN || !token || token !== process.env.MIGRATE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 })
  }

  const client = createClient({ url: process.env.DATABASE_URL })
  const results: string[] = []

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "checksum" TEXT NOT NULL,
        "finished_at" DATETIME,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" DATETIME,
        "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
        "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
      )
    `)

    for (const { name, sql } of MIGRATIONS) {
      const existing = await client.execute({
        sql: `SELECT id FROM "_prisma_migrations" WHERE migration_name = ?`,
        args: [name],
      })
      if (existing.rows.length > 0) {
        results.push(`SKIP ${name}`)
        continue
      }

      const checksum = createHash("sha256").update(sql).digest("hex")
      await client.executeMultiple(sql)
      await client.execute({
        sql: `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (?, ?, datetime('now'), ?, 1)`,
        args: [randomUUID(), checksum, name],
      })
      results.push(`APPLY ${name}`)
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), results },
      { status: 500 },
    )
  } finally {
    client.close()
  }
}
