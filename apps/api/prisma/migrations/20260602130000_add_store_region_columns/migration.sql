-- AlterTable
-- 카카오 coord2regioncode 결과를 구조화 저장 (조회당 외부 호출 0).
-- 기존 데이터 백필은 운영 작업(prisma/scripts/backfill-store-region.ts)으로 별도 수행.
ALTER TABLE "stores" ADD COLUMN "region_sido" VARCHAR(50);
ALTER TABLE "stores" ADD COLUMN "region_sigungu" VARCHAR(50);
ALTER TABLE "stores" ADD COLUMN "region_dong" VARCHAR(50);
