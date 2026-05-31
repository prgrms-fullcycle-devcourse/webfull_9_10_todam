/*
  Warnings:

  - You are about to drop the column `email` on the `partners` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business_documents" ADD COLUMN     "email" VARCHAR(255);

-- AlterTable
ALTER TABLE "partners" DROP COLUMN "email";
