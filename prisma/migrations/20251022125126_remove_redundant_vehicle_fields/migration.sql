/*
  Warnings:

  - You are about to drop the column `replacementVehicle` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleIndex` on the `Trip` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "replacementVehicle",
DROP COLUMN "vehicleIndex",
ADD COLUMN     "replacementVehicles" TEXT,
ADD COLUMN     "vehicleCount" INTEGER;
