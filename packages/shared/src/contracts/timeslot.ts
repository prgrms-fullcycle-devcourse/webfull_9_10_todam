import { z } from 'zod';

import { StoreTimeSlotStatus } from '../enums/store-time-slot-status';

// ─── 에러 코드 (api 공통 계약) ───────────────────────────────────
// 타임슬롯 자동 생성(POST .../time-slots/generate) 에러 코드.
export const TimeSlotErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
    OPERATING_HOURS_NOT_SET: 'OPERATING_HOURS_NOT_SET',
    INTERVAL_NOT_CONFIGURED: 'INTERVAL_NOT_CONFIGURED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type TimeSlotErrorCode = (typeof TimeSlotErrorCode)[keyof typeof TimeSlotErrorCode];

// ─── 자동 생성 요청 (POST /partner/stores/{storeId}/time-slots/generate) ─────
// 날짜 범위만. 시간/간격/정원은 공방 설정에서 BE 가 자동 조회. 단일 날짜는 startDate == endDate.
export const generateTimeSlotsRequestSchema = z.object({
    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate는 YYYY-MM-DD 형식이어야 합니다.')
        .meta({ example: '2026-06-01' }),
    endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate는 YYYY-MM-DD 형식이어야 합니다.')
        .meta({ example: '2026-06-07' }),
});
export type GenerateTimeSlotsRequest = z.infer<typeof generateTimeSlotsRequestSchema>;

// ─── 생성된 슬롯 항목 ────────────────────────────────────────────
export const generatedTimeSlotSchema = z.object({
    slotId: z.string().meta({ example: 'slot-uuid-001' }),
    startAt: z.string().meta({ example: '2026-06-01T10:00:00.000Z' }),
    endAt: z.string().meta({ example: '2026-06-01T11:00:00.000Z' }),
    status: z.nativeEnum(StoreTimeSlotStatus).meta({ example: StoreTimeSlotStatus.OPEN }),
    reservedCount: z.number().meta({ example: 0 }),
});
export type GeneratedTimeSlot = z.infer<typeof generatedTimeSlotSchema>;

// ─── 자동 생성 응답 ──────────────────────────────────────────────
// createdCount: 신규 생성 슬롯 수, skippedCount: 멱등 스킵(이미 존재) + 과거 시각 스킵 합산,
// removedCount: 영업시간/요일/interval 변경으로 새 격자에서 사라진 예약없는 미래 슬롯 삭제 수.
export const generateTimeSlotsResultSchema = z.object({
    createdCount: z.number().meta({ example: 28 }),
    removedCount: z.number().meta({
        example: 2,
        description: '영업시간/요일/interval 변경으로 삭제된 미래 빈 슬롯 수',
    }),
    skippedCount: z.number().meta({ example: 4 }),
    createdSlots: z
        .array(generatedTimeSlotSchema)
        .meta({ description: '신규 생성된 타임슬롯 목록' }),
});
export type GenerateTimeSlotsResult = z.infer<typeof generateTimeSlotsResultSchema>;

// ─── 타임슬롯 상태 변경 (PATCH .../time-slots/{timeSlotId}/status) ─────
export const updateTimeSlotStatusRequestSchema = z.object({
    status: z
        .nativeEnum(StoreTimeSlotStatus, {
            error: 'status는 OPEN, CLOSED, CANCELED 중 하나여야 합니다.',
        })
        .meta({ example: StoreTimeSlotStatus.CLOSED }),
});
export type UpdateTimeSlotStatusRequest = z.infer<typeof updateTimeSlotStatusRequestSchema>;

// ─── 예약 제한 시간 범위 (ISO 8601, offset 포함) ──────────────────
export const reservationRestrictionTimeRangeSchema = z.object({
    startAt: z.string().datetime({ offset: true }).meta({ example: '2026-06-10T10:00:00+09:00' }),
    endAt: z.string().datetime({ offset: true }).meta({ example: '2026-06-10T12:00:00+09:00' }),
});
export type ReservationRestrictionTimeRange = z.infer<typeof reservationRestrictionTimeRangeSchema>;

// ─── 예약 제한 생성 (POST /partner/stores/{storeId}/reservation-restrictions) ─────
// scope=ALL_DAY 종일 막기 / TIME_SLOTS 부분 막기(timeRanges). programIds 최소 1개.
export const createReservationRestrictionsRequestSchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date는 YYYY-MM-DD 형식이어야 합니다.')
        .meta({ example: '2026-06-10' }),
    scope: z
        .enum(['ALL_DAY', 'TIME_SLOTS'], {
            error: 'scope는 ALL_DAY, TIME_SLOTS 중 하나여야 합니다.',
        })
        .meta({ example: 'TIME_SLOTS' }),
    timeRanges: z
        .array(reservationRestrictionTimeRangeSchema)
        .meta({ description: 'scope=TIME_SLOTS일 때 막을 시간 범위 목록' })
        .optional(),
    programIds: z
        .array(z.string().uuid())
        .min(1, 'programIds는 최소 1개 이상이어야 합니다.')
        .meta({ example: ['11111111-1111-1111-1111-111111111111'] }),
});
export type CreateReservationRestrictionsRequest = z.infer<
    typeof createReservationRestrictionsRequestSchema
>;

// ─── 예약 제한 해제 (DELETE /partner/stores/{storeId}/reservation-restrictions) ─────
// 조건 매칭(date/timeRanges/programIds) 또는 개별 restrictionIds. 전부 optional.
export const deleteReservationRestrictionsRequestSchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date는 YYYY-MM-DD 형식이어야 합니다.')
        .meta({ example: '2026-06-10' })
        .optional(),
    timeRanges: z.array(reservationRestrictionTimeRangeSchema).optional(),
    programIds: z
        .array(z.string().uuid())
        .meta({ example: ['11111111-1111-1111-1111-111111111111'] })
        .optional(),
    restrictionIds: z
        .array(z.string().uuid())
        .meta({ example: ['22222222-2222-2222-2222-222222222222'] })
        .optional(),
});
export type DeleteReservationRestrictionsRequest = z.infer<
    typeof deleteReservationRestrictionsRequestSchema
>;
