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
    status: z.enum(['OPEN', 'CLOSED', 'CANCELED']).meta({ example: StoreTimeSlotStatus.OPEN }),
    reservedCount: z.number().meta({ example: 0 }),
});
export type GeneratedTimeSlot = z.infer<typeof generatedTimeSlotSchema>;

// ─── 자동 생성 응답 ──────────────────────────────────────────────
// createdCount: 신규 생성 슬롯 수, skippedCount: 멱등 스킵(이미 존재) + 과거 시각 스킵 합산,
// removedCount: 영업시간/요일/interval 변경으로 새 격자에서 사라진 예약없는 미래 슬롯 삭제 수,
// closedCount: 새 격자에서 벗어났지만 활성 예약이 있어 CLOSED로 전환된 슬롯 수(신규 예약 차단·기존 예약 보존).
export const generateTimeSlotsResultSchema = z.object({
    createdCount: z.number().meta({ example: 28 }),
    removedCount: z.number().meta({
        example: 2,
        description: '영업시간/요일/interval 변경으로 삭제된 미래 빈 슬롯 수',
    }),
    closedCount: z.number().meta({
        example: 1,
        description: '새 격자에서 벗어났지만 활성 예약이 있어 CLOSED로 전환된 슬롯 수',
    }),
    skippedCount: z.number().meta({ example: 4 }),
    createdSlots: z
        .array(generatedTimeSlotSchema)
        .meta({ description: '신규 생성된 타임슬롯 목록' }),
});
export type GenerateTimeSlotsResult = z.infer<typeof generateTimeSlotsResultSchema>;

// ─── 타임슬롯 상태 변경 (PATCH .../time-slots/status) ──────────────────
export const slotKeySchema = z
    .string()
    .refine((value) => {
        const [startAt, endAt, extra] = value.split('|');
        const isoDateTimeSchema = z.string().datetime({ offset: true });
        return (
            extra === undefined &&
            !!startAt &&
            !!endAt &&
            isoDateTimeSchema.safeParse(startAt).success &&
            isoDateTimeSchema.safeParse(endAt).success &&
            Date.parse(startAt) < Date.parse(endAt)
        );
    }, 'slotKey는 startAtISO|endAtISO 형식이어야 합니다.')
    .meta({
        example: '2026-06-10T05:00:00.000Z|2026-06-10T06:00:00.000Z',
    });

export const updateTimeSlotStatusRequestSchema = z.object({
    slotKey: slotKeySchema,
    status: z
        .nativeEnum(StoreTimeSlotStatus, {
            error: 'status는 OPEN, CLOSED, CANCELED 중 하나여야 합니다.',
        })
        .meta({ example: StoreTimeSlotStatus.CLOSED }),
});
export type UpdateTimeSlotStatusRequest = z.infer<typeof updateTimeSlotStatusRequestSchema>;

export const updateTimeSlotStatusResultSchema = z.object({
    slotKey: slotKeySchema,
    status: z.enum(['OPEN', 'CLOSED', 'CANCELED']).meta({ example: StoreTimeSlotStatus.CLOSED }),
    updatedAt: z.string().datetime({ offset: true }).meta({ example: '2026-06-10T05:00:00.000Z' }),
});
export type UpdateTimeSlotStatusResult = z.infer<typeof updateTimeSlotStatusResultSchema>;

// ─── 예약 제한 시간 범위 (ISO 8601, offset 포함) ──────────────────
export const reservationRestrictionTimeRangeSchema = z
    .object({
        startAt: z
            .string()
            .datetime({ offset: true })
            .meta({ example: '2026-06-10T10:00:00+09:00' }),
        endAt: z.string().datetime({ offset: true }).meta({ example: '2026-06-10T12:00:00+09:00' }),
    })
    .refine(({ startAt, endAt }) => Date.parse(startAt) < Date.parse(endAt), {
        message: 'startAt은 endAt보다 이전이어야 합니다.',
        path: ['endAt'],
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

export const createdReservationRestrictionSchema = z.object({
    id: z.string().meta({ example: 'restriction-uuid-001' }),
    startAt: z.string().datetime({ offset: true }).meta({ example: '2026-06-10T01:00:00.000Z' }),
    endAt: z.string().datetime({ offset: true }).meta({ example: '2026-06-10T02:00:00.000Z' }),
    programId: z.string().meta({ example: 'program-uuid-001' }),
});
export type CreatedReservationRestriction = z.infer<typeof createdReservationRestrictionSchema>;

export const createReservationRestrictionsResultSchema = z.object({
    appliedCount: z.number().int().nonnegative().meta({ example: 2 }),
    restrictions: z.array(createdReservationRestrictionSchema),
});
export type CreateReservationRestrictionsResult = z.infer<
    typeof createReservationRestrictionsResultSchema
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

export const deleteReservationRestrictionsResultSchema = z.object({
    removedCount: z.number().int().nonnegative().meta({ example: 2 }),
});
export type DeleteReservationRestrictionsResult = z.infer<
    typeof deleteReservationRestrictionsResultSchema
>;

// ─── 타임슬롯 조회 쿼리 (SSOT) ───────────────────────────────────────
// @Query 문자열 도착 — 숫자는 z.coerce. unknown 키 strip(기본). BE 컨트롤러
// param ZodValidationPipe 가 검증.

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// GET /partner/stores/:storeId/time-slots
export const listTimeSlotsQuerySchema = z
    .object({
        date: z
            .string()
            .regex(dateRegex, 'date는 YYYY-MM-DD 형식이어야 합니다.')
            .meta({ example: '2026-06-10' })
            .optional(),
        startDate: z
            .string()
            .regex(dateRegex, 'startDate는 YYYY-MM-DD 형식이어야 합니다.')
            .meta({ example: '2026-06-01' })
            .optional(),
        endDate: z
            .string()
            .regex(dateRegex, 'endDate는 YYYY-MM-DD 형식이어야 합니다.')
            .meta({ example: '2026-06-07' })
            .optional(),
        status: z
            .nativeEnum(StoreTimeSlotStatus, {
                error: 'status는 OPEN, CLOSED, CANCELED 중 하나여야 합니다.',
            })
            .meta({ example: StoreTimeSlotStatus.OPEN })
            .optional(),
    })
    .superRefine((value, ctx) => {
        const hasDate = value.date !== undefined;
        const hasRange = value.startDate !== undefined || value.endDate !== undefined;
        if (hasDate === hasRange || (hasRange && (!value.startDate || !value.endDate))) {
            ctx.addIssue({
                code: 'custom',
                message: 'date 또는 startDate와 endDate를 지정해야 합니다.',
            });
            return;
        }
        if (value.startDate && value.endDate) {
            const start = Date.parse(`${value.startDate}T00:00:00.000Z`);
            const end = Date.parse(`${value.endDate}T00:00:00.000Z`);
            const days = (end - start) / (24 * 60 * 60 * 1000) + 1;
            if (days < 1 || days > 92) {
                ctx.addIssue({
                    code: 'custom',
                    message: '조회 범위는 최대 92일이어야 합니다.',
                });
            }
        }
    });
export type ListTimeSlotsQuery = z.infer<typeof listTimeSlotsQuerySchema>;

export const timeSlotItemSchema = z.object({
    slotKey: z.string().meta({
        example: '2026-06-10T01:00:00.000Z|2026-06-10T02:00:00.000Z',
    }),
    startAt: z.string().meta({ example: '2026-06-10T10:00:00.000Z' }),
    endAt: z.string().meta({ example: '2026-06-10T12:00:00.000Z' }),
    reservedCount: z.number().int().nonnegative().meta({ example: 2 }),
    remainingCount: z.number().int().nonnegative().meta({ example: 4 }),
    status: z.enum(['OPEN', 'CLOSED', 'CANCELED']).meta({ example: StoreTimeSlotStatus.OPEN }),
    confirmedReservationCount: z.number().int().nonnegative().meta({ example: 2 }),
    isAvailable: z.boolean().meta({ example: true }),
    isRestricted: z.boolean().meta({ example: false }),
    restrictedProgramIds: z.array(z.string()).meta({ example: [] }),
    blockingSlotKeys: z.array(slotKeySchema).meta({ example: [] }),
});
export type TimeSlotItem = z.infer<typeof timeSlotItemSchema>;

export const listTimeSlotsResultSchema = z.object({
    slots: z.array(timeSlotItemSchema),
});
export type ListTimeSlotsResult = z.infer<typeof listTimeSlotsResultSchema>;

// GET /partner/stores/:storeId/programs/reservation-counts
export const programReservationCountsQuerySchema = z.object({
    date: z
        .string()
        .regex(dateRegex, 'date는 YYYY-MM-DD 형식이어야 합니다.')
        .meta({ example: '2026-06-10' }),
    // 콤마 구분 slotKey 목록(옵션). 미지정 시 date 전체 슬롯.
    slotKeys: z
        .string()
        .refine((value) => {
            const keys = value.split(',').map((key) => key.trim());
            return keys.length > 0 && keys.every((key) => slotKeySchema.safeParse(key).success);
        }, 'slotKeys는 콤마 구분 startAtISO|endAtISO 형식이어야 합니다.')
        .meta({
            description: '콤마 구분 startAtISO|endAtISO 목록. 미지정 시 date 전체 슬롯.',
            example: '2026-06-10T01:00:00.000Z|2026-06-10T02:00:00.000Z',
        })
        .optional(),
});
export type ProgramReservationCountsQuery = z.infer<typeof programReservationCountsQuerySchema>;

export const programReservationCountItemSchema = z.object({
    programId: z.string().meta({ example: 'program-uuid-001' }),
    programName: z.string().meta({ example: '머그컵 만들기' }),
    confirmedReservationCount: z.number().int().nonnegative().meta({ example: 3 }),
});
export type ProgramReservationCountItem = z.infer<typeof programReservationCountItemSchema>;

export const programReservationCountsResultSchema = z.object({
    programs: z.array(programReservationCountItemSchema),
});
export type ProgramReservationCountsResult = z.infer<typeof programReservationCountsResultSchema>;

// GET /programs/:programId/available-slots
export const availableSlotsQuerySchema = z.object({
    year: z.coerce
        .number()
        .int('year는 정수여야 합니다.')
        .min(2000, 'year가 올바르지 않습니다.')
        .max(2100, 'year가 올바르지 않습니다.')
        .meta({ example: 2026 }),
    month: z.coerce
        .number()
        .int('month는 정수여야 합니다.')
        .min(1, 'month는 1~12 사이여야 합니다.')
        .max(12, 'month는 1~12 사이여야 합니다.')
        .meta({ example: 6 }),
});
export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
