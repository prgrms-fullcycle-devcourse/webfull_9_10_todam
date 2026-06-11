-- Migration: NotificationSetting에 webPushEnabled 추가 + NotificationToken 신설
-- Plan: push-notification Phase 2 BE (#315)

-- 1) NotificationSetting에 web_push_enabled 컬럼 추가
--    기본값 true: 채널 마스터스위치는 on 기본 (실제 발송은 브라우저 권한+토큰 존재로 재게이트됨)
ALTER TABLE "notification_settings"
  ADD COLUMN "web_push_enabled" BOOLEAN NOT NULL DEFAULT true;

-- 2) NotificationToken 테이블 신설
--    동일 (userId, fcmToken) 재등록 시 upsert 키로 사용할 unique constraint 포함
CREATE TABLE "notification_tokens" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "fcm_token"   TEXT        NOT NULL,
  "user_agent"  TEXT,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "revoked_at"  TIMESTAMPTZ(6),

  CONSTRAINT "notification_tokens_pkey" PRIMARY KEY ("id")
);

-- 3) 인덱스 / unique 제약
CREATE UNIQUE INDEX "notification_tokens_user_id_fcm_token_key"
  ON "notification_tokens"("user_id", "fcm_token");

CREATE INDEX "notification_tokens_user_id_idx"
  ON "notification_tokens"("user_id");

-- 4) FK: user_id → users(id)
ALTER TABLE "notification_tokens"
  ADD CONSTRAINT "notification_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
