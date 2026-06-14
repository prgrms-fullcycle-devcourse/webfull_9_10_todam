CREATE TABLE "time_slot_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "StoreTimeSlotStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_slot_blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "time_slot_blocks_valid_range_check" CHECK ("start_at" < "end_at"),
    CONSTRAINT "time_slot_blocks_blocked_status_check" CHECK ("status" IN ('CLOSED', 'CANCELED')),
    CONSTRAINT "time_slot_blocks_store_id_fkey"
        FOREIGN KEY ("store_id") REFERENCES "stores"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "time_slot_blocks_store_id_start_at_end_at_status_key"
ON "time_slot_blocks"("store_id", "start_at", "end_at", "status");

CREATE INDEX "time_slot_blocks_store_id_start_at_end_at_idx"
ON "time_slot_blocks"("store_id", "start_at", "end_at");

INSERT INTO "time_slot_blocks" ("store_id", "start_at", "end_at", "status", "created_at", "updated_at")
SELECT "store_id", "start_at", "end_at", "status", "created_at", "updated_at"
FROM "store_time_slots"
WHERE "status" IN ('CLOSED', 'CANCELED')
ON CONFLICT DO NOTHING;

UPDATE "store_time_slots"
SET "status" = 'OPEN',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "status" IN ('CLOSED', 'CANCELED');
