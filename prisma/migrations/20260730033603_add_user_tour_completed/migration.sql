-- RedefineTables
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
