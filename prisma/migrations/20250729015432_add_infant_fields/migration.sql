-- AlterTable
ALTER TABLE "Passenger" ADD COLUMN     "hasInfant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "infantBirthdate" TEXT;
