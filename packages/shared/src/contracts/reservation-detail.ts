import { z } from 'zod';

import { ReservationDeliveryMethod } from '../enums/reservation-delivery-method';
import { ReservationStatus } from '../enums/reservation-status';

import { displayStateSchema } from './reservation-list';

// ─── 예약 상세 조회 (GET /reservations/{reservationId}) ──────────────
// 정본(Notion API명세 DB) 기준 + Figma 4 변형 + BE 답변 반영(D1·D2·D3·D5·D6 확정).
// docs/exec-plans/active/유저 예약 - 예약 상세조회.md 의
// "API Contract (스냅샷)" 섹션과 1:1로 바인딩한다. 임의 변경 금지.
//
// D1 (결제금액): 응답 평탄화 `totalPrice: number` — programSnapshot.price × participantCount.
// D2 (운송장): `delivery.carrier`/`trackingNumber` nullable. trackingUrl 없음(복사하기 패턴).
// D3 (수령인): 예약자와 별개 컬럼. `delivery.recipientName`/`recipientPhone`/`address`.
// D4 (리뷰): 본 응답엔 `hasReview`/`reviewId` 플래그만, 상세는 별도 endpoint.
//   ⚠️ BE 결정 대기 — 가정: `GET /reservations/{reservationId}/review` (apispec.md L843 POST 패턴 대칭).
//   채택 패턴 다르면 가벼운 리워크(api 함수 1개·queryKey 변경) 정도.
// D5 (취소): `canCancel: boolean`, `cancelDeadlineDays: number | null` (불가 dialog "n일" 치환).
// D6 (작품 단계): `artwork.progressPercent`/`remainingSteps` 즉시 렌더용. 자세히보기는 별도 endpoint/plan.

/** 배송 정보(택배 전용). `deliveryMethod === 'DELIVERY'` 일 때만 의미를 가짐. */
export const reservationDetailDeliverySchema = z.object({
    recipientName: z.string(),
    recipientPhone: z.string(),
    address: z.string(),
    carrier: z.string().nullable(),
    trackingNumber: z.string().nullable(),
});
export type ReservationDetailDelivery = z.infer<typeof reservationDetailDeliverySchema>;

/** 작품 진척 상태(IN_PROGRESS 구간만 의미). */
export const reservationDetailArtworkSchema = z.object({
    id: z.string(),
    progressPercent: z.number().min(0).max(100),
    remainingSteps: z.number().int().nonnegative(),
});
export type ReservationDetailArtwork = z.infer<typeof reservationDetailArtworkSchema>;

/** 예약 상세 정본 13 필드 + D 확장. */
export const reservationDetailSchema = z.object({
    // 정본 13 필드 (apispec.md L3096~3213).
    id: z.string(),
    storeId: z.string(),
    storeName: z.string(),
    programId: z.string(),
    programTitle: z.string(),
    scheduledAt: z.string(), // ISO 8601
    reserverName: z.string(),
    reserverPhone: z.string(),
    participantCount: z.number().int().min(1),
    deliveryMethod: z.nativeEnum(ReservationDeliveryMethod),
    shippingAddress: z.string().nullable().optional(),
    requestMemo: z.string().nullable().optional(),
    status: z.nativeEnum(ReservationStatus),
    displayState: displayStateSchema,
    artworkId: z.string().nullable().optional(),
    createdAt: z.string(), // ISO 8601

    // D1: 결제 금액 평탄화.
    totalPrice: z.number().nonnegative(),

    // D2 + D3: 배송 정보(택배 시 의미). PICKUP 이면 null.
    delivery: reservationDetailDeliverySchema.nullable(),

    // D5: 취소 가능 여부 + 시한 안내용 일수.
    canCancel: z.boolean(),
    cancelDeadlineDays: z.number().int().nonnegative().nullable(),

    // D6: 작품 진척 상태. IN_PROGRESS 구간 외에는 null.
    artwork: reservationDetailArtworkSchema.nullable(),

    // D4: 리뷰 존재 여부 플래그. 상세는 별도 endpoint 호출.
    hasReview: z.boolean(),
    reviewId: z.string().nullable(),
});
export type ReservationDetail = z.infer<typeof reservationDetailSchema>;

/** GET /reservations/{reservationId} 의 data 페이로드. */
export const reservationDetailResultSchema = z.object({
    reservation: reservationDetailSchema,
});
export type ReservationDetailResult = z.infer<typeof reservationDetailResultSchema>;

// ─── 리뷰 상세 (D4 가정 endpoint) ────────────────────────────────────
// GET /reservations/{reservationId}/review (BE 채택 패턴 결정 대기).
// 본 응답 shape 가 `data.review = { id, reservationId, rating, content, photos[], createdAt }`.

export const reviewDetailPhotoSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
});
export type ReviewDetailPhoto = z.infer<typeof reviewDetailPhotoSchema>;

export const reviewDetailSchema = z.object({
    id: z.string(),
    reservationId: z.string(),
    rating: z.number().min(0).max(5),
    content: z.string(),
    photos: z.array(reviewDetailPhotoSchema),
    createdAt: z.string(), // ISO 8601
});
export type ReviewDetail = z.infer<typeof reviewDetailSchema>;

export const reviewDetailResultSchema = z.object({
    review: reviewDetailSchema,
});
export type ReviewDetailResult = z.infer<typeof reviewDetailResultSchema>;

// 에러 코드(공통 ApiError.code 매칭용).
export const ReservationDetailErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ReservationDetailErrorCode =
    (typeof ReservationDetailErrorCode)[keyof typeof ReservationDetailErrorCode];
