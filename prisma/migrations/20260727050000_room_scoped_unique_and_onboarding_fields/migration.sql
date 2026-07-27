-- DropIndex
DROP INDEX "Room_roomNumber_key";

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN "securityDeposit" DECIMAL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "nationalId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "invoiceNoteTemplate" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Room_userId_roomNumber_key" ON "Room"("userId", "roomNumber");
