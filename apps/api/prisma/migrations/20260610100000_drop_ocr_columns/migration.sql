-- Migration: BusinessDocument에서 OCR 부수 컬럼 제거 (ocr_status, ocr_raw) + OcrStatus enum 제거
-- 사유: OCR은 폼 prefill 보조 기능이며, 문서의 신뢰 상태는 verificationStatus(진위확인, verify plan)로 일원화한다.
--   - ocr_status: 항상 null로 남는 중복 신호 → 제거. 처리 성공/실패는 응답 HTTP status로 표현.
--   - ocr_raw  : 현재 읽기·쓰기 모두 없는 죽은 컬럼 → 제거. 국세청 감사 원본이 필요하면
--                verify plan이 채우는 시점에 제대로 된 이름(예: nts_raw)으로 직접 추가한다.

-- 1) ocr_status 컬럼 제거 (enum 타입을 참조하므로 컬럼을 먼저 드롭)
ALTER TABLE "business_documents" DROP COLUMN "ocr_status";

-- 2) ocr_raw 컬럼 제거
ALTER TABLE "business_documents" DROP COLUMN "ocr_raw";

-- 3) 더 이상 참조되지 않는 enum 타입 제거
DROP TYPE "OcrStatus";
