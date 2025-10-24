-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspensionDate" TIMESTAMP(3);
