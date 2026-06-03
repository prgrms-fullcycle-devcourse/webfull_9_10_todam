-- 일회성 데이터 정정: 공방당 대표 이미지(is_thumbnail)가 2개 이상 true인 행을 정리.
-- 공방별로 1개만 대표로 유지하고 나머지는 false 로 내린다.
-- 유지 우선순위: UPLOADED(실제 업로드 완료) > sort_order 오름차순 > created_at 오름차순.
--
-- 실행:
--   pnpm --filter @todam/api exec prisma db execute \
--     --schema prisma/schema.prisma \
--     --file prisma/scripts/fix-duplicate-thumbnails.sql
--
-- 멱등(idempotent): 이미 정리된 상태에서 다시 실행해도 변화 없음.

UPDATE store_images
SET is_thumbnail = false
WHERE is_thumbnail = true
  AND id NOT IN (
    SELECT DISTINCT ON (store_id) id
    FROM store_images
    WHERE is_thumbnail = true
    ORDER BY
      store_id,
      (status = 'UPLOADED') DESC,
      sort_order ASC,
      created_at ASC
  );
