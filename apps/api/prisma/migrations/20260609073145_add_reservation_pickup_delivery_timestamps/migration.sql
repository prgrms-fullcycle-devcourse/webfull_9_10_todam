-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "delivered_at" TIMESTAMPTZ(6),
ADD COLUMN     "pickup_done_at" TIMESTAMPTZ(6),
ADD COLUMN     "pickup_ready_at" TIMESTAMPTZ(6);
