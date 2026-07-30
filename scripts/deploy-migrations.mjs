// Applies prisma/migrations/*/migration.sql directly to the production
// Turso (libSQL) database. Prisma's own migration engine is a native binary
// that can't talk to libsql:// URLs — only the JS driver adapter used at
// runtime can — so this applies the SQL directly via @libsql/client, with
// _prisma_migrations bookkeeping so `prisma migrate status` stays accurate.
//
// Usage (works the same in PowerShell, cmd, or bash — no shell-specific
// syntax, no env-var exporting required):
//
//   npx vercel env pull .env.production.local --environment=production --yes
//   node scripts/deploy-migrations.mjs
//
// Then delete .env.production.local (it holds a live secret).
import { createClient } from "@libsql/client"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash, randomUUID } from "node:crypto"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..")
const migrationsDir = join(repoRoot, "prisma", "migrations")

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const envFile = join(repoRoot, ".env.production.local")
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, "utf8").match(/^DATABASE_URL="(.+)"$/m)
    if (match) return match[1]
  }
  return null
}

const url = loadDatabaseUrl()
if (!url) {
  console.error(
    "DATABASE_URL not found. Run:\n" +
      "  npx vercel env pull .env.production.local --environment=production --yes\n" +
      "then re-run this script.",
  )
  process.exit(1)
}

const client = createClient({ url })

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
