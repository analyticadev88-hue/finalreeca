/*
  Warnings:

  - Added the required column `returnDate` to the `Inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "returnDate" TEXT NOT NULL;
