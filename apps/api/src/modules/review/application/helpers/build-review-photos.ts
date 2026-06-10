import { CDN_BASE } from '../../../../common/s3/s3-object.util';
import { ReviewPhotoInput } from '../../domain/repositories/review.repository';

/**
 * POST/PATCH 요청의 `photos?: string[]` 를 ReviewPhotoInput[] 로 변환한다.
 *
 * - 각 항목이 'http'로 시작하면 기존 유지분(imageUrl 그대로).
 * - 그 외에는 S3 key → imageUrl = `${CDN_BASE}/${entry}`.
 * - thumbnailUrl = null (BullMQ 워커 없음 — MVP).
 * - sortOrder = 배열 index.
 */
export function buildReviewPhotos(photos: string[] | undefined): ReviewPhotoInput[] {
    if (!photos || photos.length === 0) return [];
    return photos.map((entry, index): ReviewPhotoInput => {
        const imageUrl = entry.startsWith('http') ? entry : `${CDN_BASE}/${entry}`;
        return { imageUrl, thumbnailUrl: null, sortOrder: index };
    });
}
