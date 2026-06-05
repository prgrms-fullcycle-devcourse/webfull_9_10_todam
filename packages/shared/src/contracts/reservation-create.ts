import { z } from 'zod';

import { ReservationDeliveryMethod } from '../enums/reservation-delivery-method';

// ─── 예약 생성/상태변경 요청 (SSOT) ──────────────────────────────────
// BE 컨트롤러 param ZodValidationPipe 가 이 스키마로 검증한다. class-validator 규칙과
// 1:1 정합. 임의 변경 금지 — 변경 시 컨트롤러/유스케이스 입력 타입 동반 수정.

// ─── 유저 예약 생성 (POST /reservations) ─────────────────────────────
export const createUserReservationRequestSchema = z
    .object({
        programId: z.string().uuid().meta({
            description: '프로그램 ID',
            example: '11111111-1111-1111-1111-111111111111',
        }),
        slotId: z.string().uuid().meta({
            description: '선택한 슬롯 ID (StoreTimeSlot.id)',
            example: '22222222-2222-2222-2222-222222222222',
        }),
        reserverName: z.string().min(2).max(20).meta({
            description: '예약자명 (2~20자)',
            example: '김토담',
        }),
        reserverPhone: z.string().max(20).meta({
            description: '연락처 (휴대전화 형식)',
            example: '010-1234-5678',
        }),
        participantCount: z
            .number()
            .int()
            .min(1)
            .meta({ description: '참가 인원 (1 이상)', example: 2 }),
        // Program.deliverable=true면 선택, false면 PICKUP 고정(유스케이스에서 보정).
        deliveryMethod: z
            .nativeEnum(ReservationDeliveryMethod)
            .meta({
                description: 'Program.deliverable=true면 선택, false면 PICKUP 고정',
                example: ReservationDeliveryMethod.PICKUP,
            })
            .optional(),
        requestMemo: z
            .string()
            .max(500)
            .meta({ description: '예약 메모', example: '창가 자리 부탁드립니다.' })
            .optional(),
    })
    .strict();
export type CreateUserReservationRequest = z.infer<typeof createUserReservationRequestSchema>;

// ─── 파트너 수기 예약 생성 (POST /partner/.../reservations) ────────────
// 수기 등록 초기 상태는 CONFIRMED(확정) 또는 IN_PROGRESS(작업중)만 허용.
export const partnerManualInitialStatusSchema = z.union([
    z.literal('CONFIRMED'),
    z.literal('IN_PROGRESS'),
]);
export type PartnerManualInitialStatus = z.infer<typeof partnerManualInitialStatusSchema>;

export const createPartnerReservationRequestSchema = z
    .object({
        programId: z.string().meta({ example: '11111111-1111-1111-1111-111111111111' }),
        slotId: z.string().meta({ example: '22222222-2222-2222-2222-222222222222' }),
        reserverName: z.string().max(100).meta({ example: '김토담' }),
        reserverPhone: z.string().max(20).meta({ example: '010-1234-5678' }),
        participantCount: z.number().int().min(1).meta({ example: 2 }),
        deliveryMethod: z
            .nativeEnum(ReservationDeliveryMethod)
            .meta({ example: ReservationDeliveryMethod.PICKUP })
            .optional(),
        initialStatus: partnerManualInitialStatusSchema.meta({
            description: '수기 예약 초기 상태. CONFIRMED 또는 IN_PROGRESS',
            example: 'CONFIRMED',
        }),
        // 공백 문자열은 BE 에서 undefined 로 정규화(@Transform). 스키마는 길이만 제한.
        internalMemo: z.string().max(200).meta({ example: '전화로 접수한 예약입니다.' }).optional(),
    })
    .strict();
export type CreatePartnerReservationRequest = z.infer<typeof createPartnerReservationRequestSchema>;

// ─── 파트너 예약 거절 (PATCH /.../reject) ─────────────────────────────
export const rejectPartnerReservationRequestSchema = z
    .object({
        rejectReason: z
            .string()
            .max(500)
            .meta({ example: '해당 시간대 예약이 어렵습니다.' })
            .optional(),
    })
    .strict();
export type RejectPartnerReservationRequest = z.infer<typeof rejectPartnerReservationRequestSchema>;

// ─── 파트너 예약 취소 (PATCH /.../cancel) ─────────────────────────────
export const cancelPartnerReservationRequestSchema = z
    .object({
        cancelReason: z.string().max(500).meta({ example: '고객 요청으로 예약을 취소합니다.' }),
    })
    .strict();
export type CancelPartnerReservationRequest = z.infer<typeof cancelPartnerReservationRequestSchema>;
