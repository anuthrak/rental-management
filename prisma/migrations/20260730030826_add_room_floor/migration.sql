-- RedefineTables
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

-- Backfill: derive floor from the numeric suffix of roomNumber (e.g. "Room 101"
-- -> 1, "Room 205" -> 2, "301" -> 3) for rows that predate the floor column.
-- Falls back to the column default (1) when no 3+ digit suffix is found.
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
