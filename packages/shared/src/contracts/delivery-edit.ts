import { z } from 'zod';

import { PHONE_REGEX } from '../constants/regex';

// ─── 배송 정보 등록/수정 (PATCH /reservations/{reservationId}/delivery) ──
// 정본(Notion API명세 DB) 기준. docs/exec-plans/active/유저 예약 - 나의 배송 정보 수정.md
// 의 "API Contract (스냅샷)" 섹션과 1:1로 바인딩한다. 임의 변경 금지.
//
// D4 (연락처 정규식): packages/shared/src/constants/regex.ts 의 PHONE_REGEX 재사용
//   (`/^010-\d{4}-\d{4}$/`). 별도 패턴 신설 안 함.
// D6 (응답 키): 요청·응답 모두 `address` 노출. Prisma `shippingAddress` 컬럼 ↔ BE 매퍼 양방향 변환.
// D5 (`delivery.id`): MVP 응답에 미포함.

/** 요청·응답 공통 5필드. */
export const deliveryEditRequestSchema = z.object({
    recipientName: z.string().min(1, '수령인 이름을 입력해 주세요.').max(100),
    recipientPhone: z
        .string()
        .min(1, '연락처를 입력해 주세요.')
        .regex(PHONE_REGEX, '연락처는 010-0000-0000 형식이어야 합니다.'),
    postalCode: z
        .string()
        .min(1, '우편번호를 입력해 주세요.')
        .regex(/^\d{4,6}$/, '우편번호 형식이 올바르지 않습니다.'),
    address: z.string().min(1, '주소를 입력해 주세요.').max(500),
    addressDetail: z.string().max(200).optional(),
});
export type DeliveryEditRequest = z.infer<typeof deliveryEditRequestSchema>;

/** PATCH /reservations/{reservationId}/delivery 의 data 페이로드. */
export const deliveryEditResultSchema = z.object({
    delivery: deliveryEditRequestSchema,
});
export type DeliveryEditResult = z.infer<typeof deliveryEditResultSchema>;

// 에러 코드(공통 ApiError.code 매칭용).
export const DeliveryEditErrorCode = {
    DELIVERY_INFO_INVALID: 'DELIVERY_INFO_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
    PICKUP_NOT_ALLOWED: 'PICKUP_NOT_ALLOWED',
    DELIVERY_NOT_EDITABLE: 'DELIVERY_NOT_EDITABLE',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type DeliveryEditErrorCode =
    (typeof DeliveryEditErrorCode)[keyof typeof DeliveryEditErrorCode];
