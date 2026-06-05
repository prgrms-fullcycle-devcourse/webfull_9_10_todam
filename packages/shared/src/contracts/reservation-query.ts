import { z } from 'zod';

import { ReservationStatus } from '../enums/reservation-status';

// ─── 예약 조회 쿼리 (SSOT) ───────────────────────────────────────────
// @Query 는 문자열로 도착하므로 숫자는 z.coerce.number() 로 변환. unknown 키는
// strip(기본) — 기존 class-validator whitelist 동작과 동일. BE 컨트롤러 param
// ZodValidationPipe 가 이 스키마로 검증한다.

// ─── 파트너 예약 월간 캘린더 (GET /partner/.../reservations/calendar) ──
export const partnerReservationCalendarQuerySchema = z.object({
    year: z.coerce.number().int().min(1900).max(9999).meta({ example: 2026 }),
    month: z.coerce.number().int().min(1).max(12).meta({ example: 6 }),
});
export type PartnerReservationCalendarQuery = z.infer<typeof partnerReservationCalendarQuerySchema>;

// ─── 파트너 예약 목록 (GET /partner/.../reservations) ─────────────────
export const listPartnerReservationsQuerySchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다.')
        .meta({ example: '2026-06-01' }),
    status: z
        .nativeEnum(ReservationStatus)
        .meta({ example: ReservationStatus.CONFIRMED })
        .optional(),
    programId: z.string().meta({ example: '11111111-1111-1111-1111-111111111111' }).optional(),
    cursor: z.string().meta({ example: 'reservation-uuid-001' }).optional(),
    limit: z.coerce.number().int().min(1).max(100).meta({ default: 20, example: 20 }).optional(),
});
export type ListPartnerReservationsQuery = z.infer<typeof listPartnerReservationsQuerySchema>;

// ─── 나의 예약 목록 (GET /reservations/me) ────────────────────────────
export const getMyReservationsQuerySchema = z.object({
    status: z
        .nativeEnum(ReservationStatus)
        .meta({ description: 'ReservationStatus 필터', example: ReservationStatus.CONFIRMED })
        .optional(),
    cursor: z
        .string()
        .meta({ description: '이전 응답의 nextCursor (예약 id)', example: 'reservation-uuid-001' })
        .optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .meta({ description: '한 번에 가져올 항목 수 (기본 20)', example: 20 })
        .optional(),
});
export type GetMyReservationsQuery = z.infer<typeof getMyReservationsQuerySchema>;
