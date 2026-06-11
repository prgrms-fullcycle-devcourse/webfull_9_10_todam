-- Migration: BusinessDocument에 진위확인(국세청) 컬럼 추가
-- Plan: business-document-verify (BE 3번)
-- OCR plan의 start_date 컬럼이 이미 추가된 이후 별도 마이그레이션으로 적용.

-- 1) VerificationStatus enum 신설
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'MISMATCH', 'ERROR');

-- 2) BusinessState enum 신설
CREATE TYPE "BusinessState" AS ENUM ('ACTIVE', 'CLOSED', 'SUSPENDED');

-- 3) BusinessDocument에 진위확인 컬럼 추가
-- 주의: verified_at 은 init 마이그레이션(20260526072023)에서 이미 생성된 기존 컬럼.
--       이 plan은 그 의미만 "VERIFIED 통과 시각"으로 확정할 뿐 새로 추가하지 않는다.
ALTER TABLE "business_documents"
  ADD COLUMN "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "nts_raw" JSONB,
  ADD COLUMN "verification_checked_at" TIMESTAMPTZ(6),
  ADD COLUMN "business_state" "BusinessState";
