import { z } from 'zod';

import { ReservationStatus } from '../enums/reservation-status';

// ─── 파트너 예약 월간 캘린더 / 일별 목록 ──────────────────────────────
// API Contract 스냅샷(docs/exec-plans/active/partner-reservation-management.md) 기준 shape.
// ⚠️ 미확정 — 현재 mock 한정. BE 합의·Notion 등록 전까지 정본 아님:
//   - D-CALENDAR-API: GET .../reservations/calendar 응답필드(hasReservation/isUnavailable/
//     hasRestriction/reservationCount) Notion 미등록. BE 합의 후 스냅샷 갱신 필요.
//   - D-REJECT: 거절 status 의미 미확정(시안상 거절→취소 잠정).
//
// GET /partner/stores/{storeId}/reservations/calendar — 월별 집계
// GET /partner/stores/{storeId}/reservations?date= — 일별 목록 (커서)
//
// 예약 status는 BE `ReservationStatus` enum을 그대로 따른다(SSOT). 카드 표시 라벨
// (확정/대기/취소/체험완료 등)은 FE에서 enum→label로 파생한다. 거절은 별도 status 없이
// CANCELED로 통합(D-REJECT 잠정), 체험완료는 IN_PROGRESS로 표현(complete 잠정).

// 예약 출처: 고객 직접 예약 / 파트너 수동 등록.
export const reservationSourceSchema = z.enum(['CUSTOMER', 'PARTNER_MANUAL']);
export type ReservationSource = z.infer<typeof reservationSourceSchema>;

// ─── 범위 1: 월간 조회 ──────────────────────────────
export const calendarDaySchema = z.object({
    date: z.string(), // YYYY-MM-DD
    hasReservation: z.boolean(),
    isUnavailable: z.boolean(),
    // 해당 날짜에 ReservationRestriction 1건 이상(#161 데이터 참조).
    hasRestriction: z.boolean(),
    reservationCount: z.number(),
});
export type CalendarDay = z.infer<typeof calendarDaySchema>;

export const calendarDataSchema = z.object({
    year: z.number(),
    month: z.number(),
    days: z.array(calendarDaySchema),
});
export type CalendarData = z.infer<typeof calendarDataSchema>;

// ─── 범위 1: 일별 예약 목록 (파트너) ──────────────────────────────
export const reservationItemSchema = z.object({
    id: z.string(),
    programTitle: z.string(),
    durationMinutes: z.number().int().positive(),
    scheduledAt: z.string(), // ISO 8601
    reserverName: z.string(),
    participantCount: z.number(),
    status: z.nativeEnum(ReservationStatus),
    source: reservationSourceSchema,
    createdAt: z.string(), // ISO 8601
});
export type ReservationItem = z.infer<typeof reservationItemSchema>;

export const reservationListDataSchema = z.object({
    reservations: z.array(reservationItemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
});
export type ReservationListData = z.infer<typeof reservationListDataSchema>;

export const pendingReservationDateSchema = z.object({
    date: z.string(), // YYYY-MM-DD
    reservationCount: z.number().int().nonnegative(),
});
export type PendingReservationDate = z.infer<typeof pendingReservationDateSchema>;

export const pendingReservationSummarySchema = z.object({
    dates: z.array(pendingReservationDateSchema),
});
export type PendingReservationSummary = z.infer<typeof pendingReservationSummarySchema>;

export const partnerReservationStatusResponseSchema = z.object({
    reservation: z
        .object({
            id: z.string(),
            status: z.nativeEnum(ReservationStatus),
            updatedAt: z.string().optional(),
            artworkId: z.string().optional(),
            artworkStatus: z.string().optional(),
            canceledBy: z.string().nullable().optional(),
            cancelReason: z.string().nullable().optional(),
            canceledAt: z.string().nullable().optional(),
        })
        .passthrough(),
});
export type PartnerReservationStatusResponse = z.infer<
    typeof partnerReservationStatusResponseSchema
>;

export const createPartnerReservationResponseSchema = z.object({
    reservation: z.object({
        id: z.string(),
        reserverName: z.string(),
        status: z.nativeEnum(ReservationStatus),
        source: reservationSourceSchema,
        artworkId: z.string(),
        createdAt: z.string(),
    }),
});
export type CreatePartnerReservationResponse = z.infer<
    typeof createPartnerReservationResponseSchema
>;
