-- Migration: OcrStatus VERIFIED → DONE rename + BusinessDocument.start_date 컬럼 추가
-- Plan: business-document-ocr (BE 3, 4번)

-- 1) OcrStatus enum: VERIFIED → DONE 로 rename
--    RENAME VALUE 는 해당 enum 을 쓰는 기존 행 라벨을 자동으로 갱신하므로 별도 UPDATE 불필요.
ALTER TYPE "OcrStatus" RENAME VALUE 'VERIFIED' TO 'DONE';

-- 2) BusinessDocument.start_date 컬럼 추가
ALTER TABLE "business_documents" ADD COLUMN "start_date" VARCHAR(8);
