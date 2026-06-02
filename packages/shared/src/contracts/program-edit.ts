import { z } from 'zod';

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
    childFriendly: z.boolean(),
    deliverable: z.boolean(),
    status: z.nativeEnum(ProgramStatus),
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
    durationMinutes: z.number().int().positive().optional(),
    childFriendly: z.boolean().optional(),
    deliverable: z.boolean().optional(),
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
