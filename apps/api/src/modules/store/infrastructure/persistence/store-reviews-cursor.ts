import {
    decodeOpaqueCursor,
    encodeOpaqueCursor,
} from '../../../../common/pagination/opaque-cursor.util';

// GET /stores/:slug/reviews 커서 인코딩/디코딩 (opaque, base64url).
// 정렬키 분기:
//  - latest:      { createdAt, id }            (createdAt desc, id desc)
//  - rating_high: { rating, createdAt, id }    (rating desc, createdAt desc, id desc)
// contract: user-공방-리뷰-전체보기 plan API Contract(커서 기반).

export interface LatestReviewCursor {
    createdAt: string; // ISO
    id: string;
}

export interface RatingHighReviewCursor {
    rating: number; // 1~5
    createdAt: string; // ISO
    id: string;
}

export type ReviewCursorPayload = LatestReviewCursor | RatingHighReviewCursor;

export function encodeReviewCursor(payload: ReviewCursorPayload): string {
    return encodeOpaqueCursor(payload);
}

export function decodeReviewCursor(cursor: string): ReviewCursorPayload | null {
    const parsed = decodeOpaqueCursor(cursor);
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.createdAt !== 'string') {
        return null;
    }
    if (typeof parsed.rating === 'number') {
        return { rating: parsed.rating, createdAt: parsed.createdAt, id: parsed.id };
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
}

export function isRatingHighCursor(
    payload: ReviewCursorPayload,
): payload is RatingHighReviewCursor {
    return typeof (payload as RatingHighReviewCursor).rating === 'number';
}
