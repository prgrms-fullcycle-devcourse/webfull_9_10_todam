ALTER TABLE "reservations"
ADD COLUMN "scheduled_end_at" TIMESTAMPTZ(6);

UPDATE "reservations" AS r
SET "scheduled_end_at" = s."end_at"
FROM "store_time_slots" AS s
WHERE r."store_time_slot_id" = s."id";

ALTER TABLE "reservations"
ALTER COLUMN "scheduled_end_at" SET NOT NULL;
