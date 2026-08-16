-- AlterTable
ALTER TABLE "Room" ADD COLUMN "gridCol" INTEGER;
ALTER TABLE "Room" ADD COLUMN "gridRow" INTEGER;

-- CreateTable
CREATE TABLE "FloorPlanLayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    CONSTRAINT "FloorPlanLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FloorPlanLayout_userId_floor_key" ON "FloorPlanLayout"("userId", "floor");
