-- Migration: Notification 모델 reconcile (Option A) — Phase 3a BE
-- Plan: docs/exec-plans/active/push-notification.md Phase 3 BE §1
--
-- 변경 요약
--   Notification 테이블: contract 형태로 컬럼 재편 (추가 → 백필 → NOT NULL → 제거)
--   NotificationDelivery 테이블: 신설 (채널별 발송 기록)
--   신규 enum: NotificationCategory, NotificationDeliveryChannel, NotificationDeliveryStatus
--   구 enum 제거: NotificationType, NotificationStatus, NotificationChannel
--
-- 공유 RDS이므로 destructive 컬럼 DROP 전 반드시 백필 완료

-- ─────────────────────────────────────────
-- 1. 신규 enum 타입 생성
-- ─────────────────────────────────────────

CREATE TYPE "NotificationCategory" AS ENUM (
  'TRANSACTION',
  'ARTWORK',
  'DELIVERY',
  'OPERATION',
  'ENGAGEMENT'
);

CREATE TYPE "NotificationDeliveryChannel" AS ENUM (
  'WEB_PUSH'
);

CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED'
);

-- ─────────────────────────────────────────
-- 2. notifications 테이블: 신규 컬럼 추가 (nullable로 먼저 추가)
-- ─────────────────────────────────────────

-- event_type: 유즈케이스 코드 (U-1, P-1 등)
ALTER TABLE "notifications"
  ADD COLUMN "event_type" TEXT;

-- category: 알림 도메인 분류
ALTER TABLE "notifications"
  ADD COLUMN "category" "NotificationCategory";

-- deep_link: 딥링크 URL (optional)
ALTER TABLE "notifications"
  ADD COLUMN "deep_link" TEXT;

-- idempotency_key: eventType + targetId + recipientId (unique)
ALTER TABLE "notifications"
  ADD COLUMN "idempotency_key" TEXT;

-- ─────────────────────────────────────────
-- 3. notifications 테이블: 기존 rows 백필
--    legacy row → 신규 컬럼 채우기
--    (공유 RDS dev 데이터 보전)
-- ─────────────────────────────────────────

-- event_type: 기존 type enum 문자열로 채움
UPDATE "notifications"
  SET "event_type" = type::TEXT
  WHERE "event_type" IS NULL;

-- category: 기존 type 기준 매핑
--   ARTWORK_STATUS       → ARTWORK
--   RESERVATION_CONFIRMED → TRANSACTION
--   SHIPPING_STARTED     → DELIVERY
UPDATE "notifications"
  SET "category" = CASE type::TEXT
    WHEN 'ARTWORK_STATUS'        THEN 'ARTWORK'::"NotificationCategory"
    WHEN 'RESERVATION_CONFIRMED' THEN 'TRANSACTION'::"NotificationCategory"
    WHEN 'SHIPPING_STARTED'      THEN 'DELIVERY'::"NotificationCategory"
    ELSE                              'ARTWORK'::"NotificationCategory"
  END
  WHERE "category" IS NULL;

-- idempotency_key: 기존 id 값으로 채움 (uniqueness 보장)
UPDATE "notifications"
  SET "idempotency_key" = id::TEXT
  WHERE "idempotency_key" IS NULL;

-- ─────────────────────────────────────────
-- 4. NOT NULL 제약 적용 (백필 완료 후)
-- ─────────────────────────────────────────

ALTER TABLE "notifications"
  ALTER COLUMN "event_type" SET NOT NULL;

ALTER TABLE "notifications"
  ALTER COLUMN "category" SET NOT NULL;

ALTER TABLE "notifications"
  ALTER COLUMN "idempotency_key" SET NOT NULL;

-- ─────────────────────────────────────────
-- 5. idempotency_key 유니크 인덱스 추가
-- ─────────────────────────────────────────

CREATE UNIQUE INDEX "notifications_idempotency_key_key"
  ON "notifications"("idempotency_key");

-- ─────────────────────────────────────────
-- 6. 기존 불필요 인덱스 제거 (is_read 기반 → readAt으로 대체)
-- ─────────────────────────────────────────

DROP INDEX IF EXISTS "notifications_is_read_idx";

-- ─────────────────────────────────────────
-- 7. 구 컬럼 제거 (발송상태 관련 → NotificationDelivery로 이동)
--    type / isRead / sentAt / status / channel / errorReason
-- ─────────────────────────────────────────

ALTER TABLE "notifications"
  DROP COLUMN "type",
  DROP COLUMN "is_read",
  DROP COLUMN "sent_at",
  DROP COLUMN "status",
  DROP COLUMN "channel",
  DROP COLUMN "error_reason";

-- ─────────────────────────────────────────
-- 8. NotificationDelivery 테이블 신설
-- ─────────────────────────────────────────

CREATE TABLE "notification_deliveries" (
  "id"              UUID                         NOT NULL DEFAULT gen_random_uuid(),
  "notification_id" UUID                         NOT NULL,
  "channel"         "NotificationDeliveryChannel" NOT NULL,
  "status"          "NotificationDeliveryStatus"  NOT NULL DEFAULT 'PENDING',
  "attempts"        INTEGER                      NOT NULL DEFAULT 0,
  "failed_reason"   TEXT,
  "sent_at"         TIMESTAMPTZ(6),

  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- FK: notification_id → notifications(id)
ALTER TABLE "notification_deliveries"
  ADD CONSTRAINT "notification_deliveries_notification_id_fkey"
  FOREIGN KEY ("notification_id") REFERENCES "notifications"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 조회 최적화 인덱스
CREATE INDEX "notification_deliveries_notification_id_idx"
  ON "notification_deliveries"("notification_id");

-- ─────────────────────────────────────────
-- 9. 구 enum 타입 제거
--    (notifications 테이블에서 type/status/channel 컬럼이 모두 제거된 후)
-- ─────────────────────────────────────────

DROP TYPE IF EXISTS "NotificationType";
DROP TYPE IF EXISTS "NotificationStatus";
DROP TYPE IF EXISTS "NotificationChannel";
