-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('google', 'kakao');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProgramDeliveryOption" AS ENUM ('DELIVERY', 'PICKUP', 'CUSTOMER_SELECT');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProgramTimeSlotStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReservationDeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'PICKUP_READY', 'PICKUP_DONE');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('CUSTOMER', 'PARTNER_MANUAL');

-- CreateEnum
CREATE TYPE "ArtworkStatus" AS ENUM ('RESERVED', 'VISITED', 'DRYING', 'BISQUE_FIRING', 'GLAZING', 'GLAZE_FIRING', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STATUS_CHANGED', 'RESERVATION_CONFIRMED', 'SHIPPING_STARTED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('KAKAO_ALIMTALK', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('STORE', 'CLASS', 'PARTNER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'MARKETING');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nickname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "is_partner" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "withdrawn_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "kakao_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reservation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "artwork_enabled" BOOLEAN NOT NULL DEFAULT true,
    "shipping_enabled" BOOLEAN NOT NULL DEFAULT true,
    "marketing_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "rejected_reason" TEXT,
    "suspended_reason" TEXT,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "terminated_at" TIMESTAMPTZ,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_documents" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "document_url" VARCHAR(1000) NOT NULL,
    "representative_name" VARCHAR(100) NOT NULL,
    "business_name" VARCHAR(200) NOT NULL,
    "business_number" VARCHAR(20) NOT NULL,
    "business_address" VARCHAR(500) NOT NULL,
    "ocr_status" "OcrStatus",
    "ocr_raw" JSONB,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "business_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "convenience_info" JSONB,
    "rejected_reason" TEXT,
    "suspended_reason" TEXT,
    "description" TEXT,
    "address" VARCHAR(500),
    "phone" VARCHAR(20),
    "auto_confirm" BOOLEAN NOT NULL DEFAULT false,
    "status" "StoreStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_operating_hours" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TIME NOT NULL,
    "close_time" TIME NOT NULL,
    "break_time" TIME NOT NULL,

    CONSTRAINT "store_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_images" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "thumbnail_url" VARCHAR(1000),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "materials" TEXT,
    "caution" TEXT,
    "price" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "lead_time_days" INTEGER NOT NULL DEFAULT 30,
    "delivery_option" "ProgramDeliveryOption" NOT NULL DEFAULT 'CUSTOMER_SELECT',
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "thumbnail_url" VARCHAR(1000),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_snapshots" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "lead_time_days" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_time_slots" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserved_count" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgramTimeSlotStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "program_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "program_time_slot_id" UUID NOT NULL,
    "program_snapshot_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "reserver_name" VARCHAR(100) NOT NULL,
    "reserver_phone" VARCHAR(20) NOT NULL,
    "participant_count" INTEGER NOT NULL DEFAULT 1,
    "delivery_method" "ReservationDeliveryMethod" NOT NULL,
    "shipping_address" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "request_memo" TEXT,
    "memo" TEXT,
    "source" "ReservationSource" NOT NULL,
    "canceled_by" UUID,
    "cancel_reason" TEXT,
    "canceled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artworks" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT '내 작품',
    "memo" TEXT,
    "customer_memo" TEXT,
    "status" "ArtworkStatus" NOT NULL DEFAULT 'RESERVED',
    "estimated_completed_at" DATE,
    "tracking_number" VARCHAR(100),
    "carrier" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_logs" (
    "id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "from_status" "ArtworkStatus",
    "to_status" "ArtworkStatus" NOT NULL,
    "memo" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artwork_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_photos" (
    "id" UUID NOT NULL,
    "artwork_log_id" UUID NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "thumbnail_url" VARCHAR(1000),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artwork_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "artwork_id" UUID,
    "reservation_id" UUID,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ,
    "error_reason" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMPTZ,
    "channel" "NotificationChannel",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "admin_memo" TEXT,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "body" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_photos" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "image_url" VARCHAR(1000) NOT NULL,
    "thumbnail_url" VARCHAR(1000),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" UUID NOT NULL,
    "policy_type" "PolicyType" NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "is_latest" BOOLEAN NOT NULL DEFAULT false,
    "effective_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "policy_version_id" UUID NOT NULL,
    "is_agreed" BOOLEAN NOT NULL,
    "agreed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "partners_user_id_key" ON "partners"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_slug_idx" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_partner_id_idx" ON "stores"("partner_id");

-- CreateIndex
CREATE INDEX "stores_status_idx" ON "stores"("status");

-- CreateIndex
CREATE INDEX "program_time_slots_store_id_idx" ON "program_time_slots"("store_id");

-- CreateIndex
CREATE INDEX "program_time_slots_status_idx" ON "program_time_slots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "program_time_slots_program_id_starts_at_key" ON "program_time_slots"("program_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "artworks_reservation_id_key" ON "artworks"("reservation_id");

-- CreateIndex
CREATE INDEX "artworks_reservation_id_idx" ON "artworks"("reservation_id");

-- CreateIndex
CREATE INDEX "artworks_status_idx" ON "artworks"("status");

-- CreateIndex
CREATE INDEX "artwork_logs_artwork_id_idx" ON "artwork_logs"("artwork_id");

-- CreateIndex
CREATE INDEX "artwork_photos_artwork_log_id_idx" ON "artwork_photos"("artwork_log_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_artwork_id_key" ON "qr_tokens"("artwork_id");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_token_key" ON "qr_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reservation_id_key" ON "reviews"("reservation_id");

-- CreateIndex
CREATE INDEX "reviews_store_id_idx" ON "reviews"("store_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "review_photos_review_id_idx" ON "review_photos"("review_id");

-- CreateIndex
CREATE INDEX "user_consents_user_id_idx" ON "user_consents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_user_id_policy_version_id_key" ON "user_consents"("user_id", "policy_version_id");

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_operating_hours" ADD CONSTRAINT "store_operating_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_images" ADD CONSTRAINT "store_images_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_snapshots" ADD CONSTRAINT "program_snapshots_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_time_slots" ADD CONSTRAINT "program_time_slots_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_time_slots" ADD CONSTRAINT "program_time_slots_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_program_time_slot_id_fkey" FOREIGN KEY ("program_time_slot_id") REFERENCES "program_time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_program_snapshot_id_fkey" FOREIGN KEY ("program_snapshot_id") REFERENCES "program_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_logs" ADD CONSTRAINT "artwork_logs_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_logs" ADD CONSTRAINT "artwork_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_photos" ADD CONSTRAINT "artwork_photos_artwork_log_id_fkey" FOREIGN KEY ("artwork_log_id") REFERENCES "artwork_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
