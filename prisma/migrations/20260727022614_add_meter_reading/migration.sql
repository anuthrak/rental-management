-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "readingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waterMeterValue" DECIMAL NOT NULL,
    "electricMeterValue" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeterReading_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MeterReading_roomId_idx" ON "MeterReading"("roomId");
