/*
  Warnings:

  - You are about to drop the column `busId` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Bus` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `boardingPoint` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureDate` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `droppingPoint` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMinutes` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fare` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routeName` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSeats` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Made the column `routeOrigin` on table `Trip` required. This step will fail if there are existing NULL values in that column.
  - Made the column `routeDestination` on table `Trip` required. This step will fail if there are existing NULL values in that column.
  - Made the column `departureTime` on table `Trip` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_busId_fkey";

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "busId",
DROP COLUMN "date",
ADD COLUMN     "boardingPoint" TEXT NOT NULL,
ADD COLUMN     "departureDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "droppingPoint" TEXT NOT NULL,
ADD COLUMN     "durationMinutes" INTEGER NOT NULL,
ADD COLUMN     "fare" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "hasDeparted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occupiedSeats" TEXT,
ADD COLUMN     "promoActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "routeName" TEXT NOT NULL,
ADD COLUMN     "serviceType" TEXT NOT NULL,
ADD COLUMN     "totalSeats" INTEGER NOT NULL,
ALTER COLUMN "routeOrigin" SET NOT NULL,
ALTER COLUMN "routeDestination" SET NOT NULL,
ALTER COLUMN "departureTime" SET NOT NULL,
ALTER COLUMN "departureTime" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Bus";

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "returnTripId" TEXT,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT,
    "seats" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "boardingPoint" TEXT NOT NULL,
    "droppingPoint" TEXT NOT NULL,
    "returnBoardingPoint" TEXT,
    "returnDroppingPoint" TEXT,
    "orderId" TEXT NOT NULL,
    "transactionToken" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "bookingStatus" TEXT NOT NULL DEFAULT 'confirmed',
    "promoCode" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "lastScanned" TIMESTAMP(3),
    "scannerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_orderId_key" ON "Booking"("orderId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_returnTripId_fkey" FOREIGN KEY ("returnTripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
