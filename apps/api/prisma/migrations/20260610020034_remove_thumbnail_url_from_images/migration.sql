-- 이미지 리사이징을 next/image 위임으로 전환 → 미사용 thumbnail_url 컬럼 제거.
-- 대상 컬럼은 모두 nullable·미적재 상태라 데이터 손실 없음.

-- DropColumn
ALTER TABLE "store_images" DROP COLUMN "thumbnail_url";
ALTER TABLE "program_images" DROP COLUMN "thumbnail_url";
ALTER TABLE "artwork_photos" DROP COLUMN "thumbnail_url";
ALTER TABLE "review_photos" DROP COLUMN "thumbnail_url";
