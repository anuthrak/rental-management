-- RedefineTables
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
