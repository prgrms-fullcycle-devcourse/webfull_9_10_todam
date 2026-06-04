/*
  Warnings:

  - You are about to drop the column `program_time_slot_id` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the `program_time_slots` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `store_time_slot_id` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StoreTimeSlotStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "program_time_slots" DROP CONSTRAINT "program_time_slots_program_id_fkey";

-- DropForeignKey
ALTER TABLE "program_time_slots" DROP CONSTRAINT "program_time_slots_store_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_program_time_slot_id_fkey";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "program_time_slot_id",
ADD COLUMN     "store_time_slot_id" UUID NOT NULL;

-- DropTable
DROP TABLE "program_time_slots";

-- DropEnum
DROP TYPE "ProgramTimeSlotStatus";

-- CreateTable
CREATE TABLE "store_time_slots" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "reserved_count" INTEGER NOT NULL DEFAULT 0,
    "status" "StoreTimeSlotStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "store_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_restrictions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "program_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_time_slots_status_idx" ON "store_time_slots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "store_time_slots_store_id_start_at_key" ON "store_time_slots"("store_id", "start_at");

-- CreateIndex
CREATE INDEX "reservation_restrictions_store_id_idx" ON "reservation_restrictions"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_restrictions_store_id_start_at_program_id_key" ON "reservation_restrictions"("store_id", "start_at", "program_id");

-- AddForeignKey
ALTER TABLE "store_time_slots" ADD CONSTRAINT "store_time_slots_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_restrictions" ADD CONSTRAINT "reservation_restrictions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_restrictions" ADD CONSTRAINT "reservation_restrictions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_store_time_slot_id_fkey" FOREIGN KEY ("store_time_slot_id") REFERENCES "store_time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
