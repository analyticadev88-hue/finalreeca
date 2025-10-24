/*
  Warnings:

  - Added the required column `idNumber` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "idNumber" TEXT NOT NULL,
ADD COLUMN     "mobile" TEXT NOT NULL,
ADD COLUMN     "organization" TEXT NOT NULL;
