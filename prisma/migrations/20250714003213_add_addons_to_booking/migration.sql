/*
  Warnings:

  - You are about to drop the column `name` on the `Passenger` table. All the data in the column will be lost.
  - You are about to alter the column `fare` on the `Trip` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `contactIdNumber` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Passenger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Passenger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Passenger` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Passenger" DROP CONSTRAINT "Passenger_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "addons" JSONB,
ADD COLUMN     "contactIdNumber" TEXT NOT NULL,
ADD COLUMN     "returnSeats" TEXT;

-- AlterTable
ALTER TABLE "Passenger" DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "isReturn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "fare" SET DATA TYPE INTEGER;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
