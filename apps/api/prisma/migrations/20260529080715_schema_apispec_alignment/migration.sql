/*
  Warnings:

  - The values [SUCCESS] on the enum `OcrStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `representative_name` on the `business_documents` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `is_primary` on the `store_images` table. All the data in the column will be lost.
  - You are about to drop the column `break_time` on the `store_operating_hours` table. All the data in the column will be lost.
  - Added the required column `owner_name` to the `business_documents` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `day_of_week` on the `store_operating_hours` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- AlterEnum
BEGIN;
CREATE TYPE "OcrStatus_new" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
ALTER TABLE "business_documents" ALTER COLUMN "ocr_status" TYPE "OcrStatus_new" USING ("ocr_status"::text::"OcrStatus_new");
ALTER TYPE "OcrStatus" RENAME TO "OcrStatus_old";
ALTER TYPE "OcrStatus_new" RENAME TO "OcrStatus";
DROP TYPE "public"."OcrStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "business_documents" DROP COLUMN "representative_name",
ADD COLUMN     "owner_name" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "suspended_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "programs" DROP COLUMN "thumbnail_url",
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "store_images" DROP COLUMN "is_primary",
ADD COLUMN     "is_thumbnail" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "store_operating_hours" DROP COLUMN "break_time",
ADD COLUMN     "break_end" TIME(6),
ADD COLUMN     "break_start" TIME(6),
DROP COLUMN "day_of_week",
ADD COLUMN     "day_of_week" "DayOfWeek" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "favorite_stores" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_images" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "thumbnail_url" VARCHAR(1000),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_thumbnail" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_stores_user_id_idx" ON "favorite_stores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_stores_user_id_store_id_key" ON "favorite_stores"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "program_images_program_id_idx" ON "program_images"("program_id");

-- AddForeignKey
ALTER TABLE "favorite_stores" ADD CONSTRAINT "favorite_stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_stores" ADD CONSTRAINT "favorite_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_images" ADD CONSTRAINT "program_images_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
