-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "address_detail" VARCHAR(200),
ADD COLUMN     "postal_code" VARCHAR(10),
ADD COLUMN     "recipient_name" VARCHAR(100),
ADD COLUMN     "recipient_phone" VARCHAR(20);
