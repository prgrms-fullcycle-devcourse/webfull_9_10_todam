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
    title: z.string().min(2).max(60),
    description: z.string().max(1000).nullable().optional(),
    materials: z.string().nullable().optional(),
    caution: z.string().nullable().optional(),
    price: z.number().int().positive(),
    durationMinutes: z.number().int().min(30).max(480),
    difficulty: z.nativeEnum(ProgramDifficulty),
    childFriendly: z.boolean(),
    leadTimeDays: z.number().int().min(0),
    deliverable: z.boolean(),
});
export type CreateProgramRequest = z.infer<typeof createProgramRequestSchema>;

export const createProgramResultSchema = z.object({
    program: z.object({
        id: z.string(),
        storeId: z.string(),
        title: z.string(),
        status: z.nativeEnum(ProgramStatus),
        createdAt: z.string(),
    }),
});
export type CreateProgramResult = z.infer<typeof createProgramResultSchema>;

// ─── PATCH /partner/stores/{storeId}/programs/{programId}/status ──
export const updateProgramStatusRequestSchema = z.object({
    status: z.nativeEnum(ProgramStatus),
});
export type UpdateProgramStatusRequest = z.infer<typeof updateProgramStatusRequestSchema>;

export const updateProgramStatusResultSchema = z.object({
    program: z.object({
        id: z.string(),
        status: z.nativeEnum(ProgramStatus),
        updatedAt: z.string(),
    }),
});
export type UpdateProgramStatusResult = z.infer<typeof updateProgramStatusResultSchema>;

// ─── PATCH .../images/{imageId}/confirm — 업로드 완료 확인 ────────
export const confirmProgramImageResultSchema = z.object({
    image: z.object({
        id: z.string(),
        status: z.string(),
    }),
});
export type ConfirmProgramImageResult = z.infer<typeof confirmProgramImageResultSchema>;
