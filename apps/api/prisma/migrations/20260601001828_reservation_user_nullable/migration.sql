-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_user_id_fkey";

-- AlterTable
ALTER TABLE "reservations" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
