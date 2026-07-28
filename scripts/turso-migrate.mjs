// One-off: applies prisma/migrations/*/migration.sql directly to a Turso
// (libSQL) database via @libsql/client, since Prisma's CLI migration
// engine is a native binary that doesn't understand libsql:// URLs (only
// the JS driver adapter used at runtime does). Also writes bookkeeping
// rows into _prisma_migrations matching Prisma's own schema/checksum
// format, so `prisma migrate status` reads a consistent history.
import { createClient } from "@libsql/client"
import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash, randomUUID } from "node:crypto"

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, "..", "prisma", "migrations")

const url = process.env.TURSO_URL
const authToken = process.env.TURSO_TOKEN
if (!url || !authToken) {
  console.error("Set TURSO_URL and TURSO_TOKEN env vars first.")
  process.exit(1)
}

const client = createClient({ url, authToken })

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

const folders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

for (const folder of folders) {
  const sqlPath = join(migrationsDir, folder, "migration.sql")
  const sql = readFileSync(sqlPath, "utf8")
  const checksum = createHash("sha256").update(sql).digest("hex")

  const existing = await client.execute({
    sql: `SELECT id FROM "_prisma_migrations" WHERE migration_name = ?`,
    args: [folder],
  })
  if (existing.rows.length > 0) {
    console.log(`SKIP  ${folder} (already applied)`)
    continue
  }

  console.log(`APPLY ${folder} ...`)
  await client.executeMultiple(sql)
  await client.execute({
    sql: `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (?, ?, datetime('now'), ?, 1)`,
    args: [randomUUID(), checksum, folder],
  })
  console.log(`OK    ${folder}`)
}

console.log("All migrations applied.")
client.close()
