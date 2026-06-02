-- CreateEnum
CREATE TYPE "ProgramDifficulty" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "programs"
    ADD COLUMN "difficulty" "ProgramDifficulty" NOT NULL DEFAULT 'BASIC',
    ADD COLUMN "child_friendly" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "deliverable" BOOLEAN NOT NULL DEFAULT false,
    DROP COLUMN "delivery_option";

-- DropEnum
DROP TYPE "ProgramDeliveryOption";
