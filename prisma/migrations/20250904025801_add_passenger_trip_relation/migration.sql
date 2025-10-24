/*
  Warnings:

  - A unique constraint covering the columns `[tripId,seatNumber]` on the table `Passenger` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tripId` to the `Passenger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Passenger" ADD COLUMN     "tripId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_tripId_seatNumber_key" ON "Passenger"("tripId", "seatNumber");

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
