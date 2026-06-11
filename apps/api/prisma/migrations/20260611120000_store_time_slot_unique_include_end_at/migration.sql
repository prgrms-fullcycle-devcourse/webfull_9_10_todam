-- 같은 startAt에 길이(endAt)가 다른 슬롯 공존 허용:
-- (store_id, start_at) 유일 → (store_id, start_at, end_at) 유일로 완화.
-- 기존 데이터는 (store_id, start_at) 유일을 이미 만족하므로 충돌 없이 적용 가능.

-- DropIndex
DROP INDEX "store_time_slots_store_id_start_at_key";

-- CreateIndex
CREATE UNIQUE INDEX "store_time_slots_store_id_start_at_end_at_key" ON "store_time_slots"("store_id", "start_at", "end_at");
