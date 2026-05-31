/*
  Warnings:

  - The values [STATUS_CHANGED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CLASS] on the enum `ReportTargetType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `carrier` on the `artworks` table. All the data in the column will be lost.
  - You are about to drop the column `memo` on the `artworks` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_number` on the `artworks` table. All the data in the column will be lost.
  - You are about to drop the column `ends_at` on the `program_time_slots` table. All the data in the column will be lost.
  - You are about to drop the column `starts_at` on the `program_time_slots` table. All the data in the column will be lost.
  - You are about to drop the column `memo` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_address` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[program_id,start_at]` on the table `program_time_slots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `end_at` to the `program_time_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_at` to the `program_time_slots` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImageUploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ARTWORK_STATUS', 'RESERVATION_CONFIRMED', 'SHIPPING_STARTED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReportTargetType_new" AS ENUM ('STORE', 'PROGRAM', 'PARTNER');
ALTER TABLE "reports" ALTER COLUMN "target_type" TYPE "ReportTargetType_new" USING ("target_type"::text::"ReportTargetType_new");
ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
ALTER TYPE "ReportTargetType_new" RENAME TO "ReportTargetType";
DROP TYPE "public"."ReportTargetType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "StoreStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "program_time_slots_program_id_starts_at_key";

-- AlterTable
ALTER TABLE "artwork_photos" ADD COLUMN     "status" "ImageUploadStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "artworks" DROP COLUMN "carrier",
DROP COLUMN "memo",
DROP COLUMN "tracking_number",
ADD COLUMN     "internal_memo" TEXT;

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "email" VARCHAR(255);

-- AlterTable
ALTER TABLE "program_images" ADD COLUMN     "status" "ImageUploadStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "program_time_slots" DROP COLUMN "ends_at",
DROP COLUMN "starts_at",
ADD COLUMN     "end_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "start_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "memo",
DROP COLUMN "shipping_address",
ADD COLUMN     "internal_memo" TEXT;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "body",
ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "store_images" ADD COLUMN     "status" "ImageUploadStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "shipping_address" TEXT,
    "tracking_number" VARCHAR(100),
    "carrier" VARCHAR(50),
    "shipped_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_reservation_id_key" ON "deliveries"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_time_slots_program_id_start_at_key" ON "program_time_slots"("program_id", "start_at");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
