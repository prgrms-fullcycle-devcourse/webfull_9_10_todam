import { z } from 'zod';

import { ProgramDifficulty } from '../enums/program-difficulty';
import { ProgramStatus } from '../enums/program-status';

// ─── 에러 코드 (web mock·api 공통 계약) ──────────────────────────
// plan API Contract 스냅샷(partner-class-create.md) 바인딩.
export const ProgramRegistrationErrorCode = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    STORE_NOT_PUBLISHED: 'STORE_NOT_PUBLISHED',
    INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    IMAGE_NOT_UPLOADED: 'IMAGE_NOT_UPLOADED',
    PROGRAM_IMAGE_NOT_FOUND: 'PROGRAM_IMAGE_NOT_FOUND',
    ALREADY_UPLOADED: 'ALREADY_UPLOADED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ProgramRegistrationErrorCode =
    (typeof ProgramRegistrationErrorCode)[keyof typeof ProgramRegistrationErrorCode];

// ─── POST /partner/stores/{storeId}/programs — 클래스 등록 ────────
export const createProgramRequestSchema = z.object({
    title: z
        .string()
        .min(2, '클래스명은 2자 이상이어야 합니다.')
        .max(60, '클래스명은 60자 이하여야 합니다.')
        .meta({ example: '물레 체험 기초반' }),
    description: z
        .string()
        .max(1000, '상세 설명은 1000자 이하여야 합니다.')
        .meta({ example: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.' })
        .nullable()
        .optional(),
    materials: z.string().meta({ example: '앞치마 (공방 제공), 편한 복장' }).nullable().optional(),
    caution: z.string().meta({ example: '체험 당일 취소는 불가합니다.' }).nullable().optional(),
    price: z
        .number()
        .int('가격은 정수여야 합니다.')
        .positive('가격은 양의 정수여야 합니다.')
        .meta({ example: 45000, description: '양의 정수 (원 단위)' }),
    durationMinutes: z
        .number()
        .int('소요시간은 정수여야 합니다.')
        .min(30, '소요시간은 30분 이상이어야 합니다.')
        .max(480, '소요시간은 480분 이하여야 합니다.')
        .meta({ example: 120, description: '30~480분' }),
    difficulty: z
        .nativeEnum(ProgramDifficulty, {
            error: '난이도는 BASIC, INTERMEDIATE, ADVANCED 중 하나여야 합니다.',
        })
        .meta({ example: ProgramDifficulty.BASIC }),
    childFriendly: z.boolean().meta({ example: false, description: '어린이 동반 가능 여부' }),
    leadTimeDays: z
        .number()
        .int('리드타임은 정수여야 합니다.')
        .min(0, '리드타임은 0일 이상이어야 합니다.')
        .meta({ example: 30, description: '0일 이상' }),
    deliverable: z.boolean().meta({ example: true, description: '택배 가능 여부' }),
});
export type CreateProgramRequest = z.infer<typeof createProgramRequestSchema>;

export const createProgramResultSchema = z.object({
    program: z.object({
        id: z.string().meta({ example: 'program-uuid-001' }),
        storeId: z.string().meta({ example: 'store-uuid-001' }),
        title: z.string().meta({ example: '물레 체험 기초반' }),
        status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.DRAFT }),
        createdAt: z.string().meta({ example: '2026-06-05T13:00:00.000Z' }),
    }),
});
export type CreateProgramResult = z.infer<typeof createProgramResultSchema>;

// ─── PATCH /partner/stores/{storeId}/programs/{programId}/status ──
export const updateProgramStatusRequestSchema = z.object({
    status: z
        .nativeEnum(ProgramStatus, {
            error: '상태는 DRAFT, ACTIVE, INACTIVE 중 하나여야 합니다.',
        })
        .meta({ example: ProgramStatus.ACTIVE }),
});
export type UpdateProgramStatusRequest = z.infer<typeof updateProgramStatusRequestSchema>;

export const updateProgramStatusResultSchema = z.object({
    program: z.object({
        id: z.string().meta({ example: 'program-uuid-001' }),
        status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.ACTIVE }),
        updatedAt: z.string().meta({ example: '2026-06-05T14:00:00.000Z' }),
    }),
});
export type UpdateProgramStatusResult = z.infer<typeof updateProgramStatusResultSchema>;

// ─── PATCH .../images/{imageId}/confirm — 업로드 완료 확인 ────────
export const confirmProgramImageResultSchema = z.object({
    image: z.object({
        id: z.string().meta({ example: 'program-image-uuid-001' }),
        status: z.string().meta({ example: 'UPLOADED' }),
    }),
});
export type ConfirmProgramImageResult = z.infer<typeof confirmProgramImageResultSchema>;
