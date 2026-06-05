-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "last_accessed_store_id" UUID;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_last_accessed_store_id_fkey" FOREIGN KEY ("last_accessed_store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
