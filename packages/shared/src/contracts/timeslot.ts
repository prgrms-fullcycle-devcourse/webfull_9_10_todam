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
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type GenerateTimeSlotsRequest = z.infer<typeof generateTimeSlotsRequestSchema>;

// ─── 생성된 슬롯 항목 ────────────────────────────────────────────
export const generatedTimeSlotSchema = z.object({
    slotId: z.string(),
    startAt: z.string(),
    endAt: z.string(),
    status: z.nativeEnum(StoreTimeSlotStatus),
    reservedCount: z.number(),
});
export type GeneratedTimeSlot = z.infer<typeof generatedTimeSlotSchema>;

// ─── 자동 생성 응답 ──────────────────────────────────────────────
// createdCount: 신규 생성 슬롯 수, skippedCount: 멱등 스킵(이미 존재) + 과거 시각 스킵 합산,
// removedCount: 영업시간/요일/interval 변경으로 새 격자에서 사라진 예약없는 미래 슬롯 삭제 수.
export const generateTimeSlotsResultSchema = z.object({
    createdCount: z.number(),
    removedCount: z.number(),
    skippedCount: z.number(),
    createdSlots: z.array(generatedTimeSlotSchema),
});
export type GenerateTimeSlotsResult = z.infer<typeof generateTimeSlotsResultSchema>;
