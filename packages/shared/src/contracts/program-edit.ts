import { z } from 'zod';

import { ProgramDeliveryOption } from '../enums/program-delivery-option';
import { ProgramDifficulty } from '../enums/program-difficulty';
import { ProgramStatus } from '../enums/program-status';

// ─── 에러 코드 ───────────────────────────────────────────────────
export const ProgramEditErrorCode = {
    PROGRAM_NOT_FOUND: 'PROGRAM_NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ProgramEditErrorCode = (typeof ProgramEditErrorCode)[keyof typeof ProgramEditErrorCode];

// ─── program_images ──────────────────────────────────────────────
export const programImageSchema = z.object({
    programImageId: z.string(),
    imageUrl: z.string(),
    thumbnailUrl: z.string(),
    isThumbnail: z.boolean(),
});
export type ProgramImage = z.infer<typeof programImageSchema>;

// ─── 프로그램 상세 (GET /stores/{slug}/programs/{programId}) ─────
export const programDetailSchema = z.object({
    id: z.string(),
    storeId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    materials: z.string().nullable().optional(),
    price: z.number(),
    durationMinutes: z.number(),
    leadTimeDays: z.number(),
    difficulty: z.nativeEnum(ProgramDifficulty).optional(),
    deliveryOption: z.nativeEnum(ProgramDeliveryOption),
    childrenAllowed: z.boolean().optional(),
    deliveryAvailable: z.boolean().optional(),
    status: z.nativeEnum(ProgramStatus),
    // 표시용 특성 태그 (예: "어린이 가능", "배송 가능"). BE 제공.
    featureTags: z.array(z.string()),
    images: z.array(programImageSchema),
});
export type ProgramDetail = z.infer<typeof programDetailSchema>;

export const programDetailResultSchema = z.object({
    program: programDetailSchema,
});
export type ProgramDetailResult = z.infer<typeof programDetailResultSchema>;

// ─── PATCH /partner/stores/{storeId}/programs/{programId} ────────
export const programEditRequestSchema = z.object({
    title: z.string().min(2).max(60).optional(),
    description: z.string().max(1000).nullable().optional(),
    difficulty: z.nativeEnum(ProgramDifficulty).optional(),
    price: z.number().int().positive().optional(),
    leadTimeDays: z.number().int().min(0).optional(),
    durationMinutes: z.number().int().multipleOf(30).optional(),
    deliveryOption: z.nativeEnum(ProgramDeliveryOption).optional(),
    childrenAllowed: z.boolean().optional(),
    deliveryAvailable: z.boolean().optional(),
});
export type ProgramEditRequest = z.infer<typeof programEditRequestSchema>;

export const programEditResultSchema = z.object({
    program: z.object({
        id: z.string(),
        title: z.string(),
        price: z.number(),
        status: z.nativeEnum(ProgramStatus),
        updatedAt: z.string(),
    }),
});
export type ProgramEditResult = z.infer<typeof programEditResultSchema>;

// ─── POST /partner/stores/{storeId}/programs/{programId}/images ──
export const programImageUploadRequestSchema = z.object({
    fileName: z.string(),
    fileType: z.string(),
    isThumbnail: z.boolean(),
});
export type ProgramImageUploadRequest = z.infer<typeof programImageUploadRequestSchema>;

export const programImageUploadResultSchema = z.object({
    programImageId: z.string(),
    uploadUrl: z.string(),
    imageUrl: z.string(),
});
export type ProgramImageUploadResult = z.infer<typeof programImageUploadResultSchema>;
