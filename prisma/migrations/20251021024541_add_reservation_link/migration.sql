/*
  Warnings:

  - You are about to drop the column `notes` on the `TripReservation` table. All the data in the column will be lost.
  - You are about to drop the column `reservedBy` on the `TripReservation` table. All the data in the column will be lost.
  - You are about to drop the column `seatsReserved` on the `TripReservation` table. All the data in the column will be lost.
  - Added the required column `reservedClientName` to the `TripReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservedSeatsCount` to the `TripReservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SeatReservation" ADD COLUMN     "tripReservationId" TEXT;

-- AlterTable: add new columns as nullable where needed to allow backfill
ALTER TABLE "TripReservation" DROP COLUMN IF EXISTS "notes",
DROP COLUMN IF EXISTS "reservedBy",
DROP COLUMN IF EXISTS "seatsReserved",
ADD COLUMN     "reservationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reservedClientName" TEXT,
ADD COLUMN     "reservedCompany" TEXT,
ADD COLUMN     "reservedContactEmail" TEXT,
ADD COLUMN     "reservedContactPhone" TEXT,
ADD COLUMN     "reservedLiaisonPerson" TEXT,
ADD COLUMN     "reservedNotes" TEXT,
ADD COLUMN     "reservedSeatsCount" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'reserved';

-- Backfill existing TripReservation rows: provide sensible defaults for required fields
-- Use existing columns if available (e.g. seatsReserved), otherwise fallback

-- Backfill with safe defaults for any existing rows
UPDATE "TripReservation"
SET "reservedClientName" = 'Unknown'
WHERE "reservedClientName" IS NULL;

UPDATE "TripReservation"
SET "reservedSeatsCount" = 1
WHERE "reservedSeatsCount" IS NULL;

-- Now make the formerly-required columns NOT NULL
ALTER TABLE "TripReservation"
ALTER COLUMN "reservedClientName" SET NOT NULL,
ALTER COLUMN "reservedSeatsCount" SET NOT NULL;

-- CreateTable
CREATE TABLE "ReservationLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tripReservationId" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationLink_token_key" ON "ReservationLink"("token");

-- CreateIndex
CREATE INDEX "ReservationLink_expiresAt_idx" ON "ReservationLink"("expiresAt");

-- AddForeignKey
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_tripReservationId_fkey" FOREIGN KEY ("tripReservationId") REFERENCES "TripReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationLink" ADD CONSTRAINT "ReservationLink_tripReservationId_fkey" FOREIGN KEY ("tripReservationId") REFERENCES "TripReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
