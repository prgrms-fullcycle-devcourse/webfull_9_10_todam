-- 수용 인원(capacity)은 공방 단위(stores.max_capacity_per_slot)로 일원화.
-- programs / program_snapshots / program_time_slots 의 capacity 컬럼 제거.

-- AlterTable
ALTER TABLE "programs" DROP COLUMN "capacity";

-- AlterTable
ALTER TABLE "program_snapshots" DROP COLUMN "capacity";

-- AlterTable
ALTER TABLE "program_time_slots" DROP COLUMN "capacity";
