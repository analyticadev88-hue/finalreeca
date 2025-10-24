-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "charterCompany" TEXT,
ADD COLUMN     "charterDates" TEXT,
ADD COLUMN     "isChartered" BOOLEAN NOT NULL DEFAULT false;
