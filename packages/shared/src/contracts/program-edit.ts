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
    programImageId: z.string().meta({ example: 'program-image-uuid-001' }).optional(),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.app/programs/pottery-01.png' }),
    thumbnailUrl: z
        .string()
        .meta({ example: 'https://cdn.todam.app/programs/pottery-01-thumb.png' })
        .nullable(),
    isThumbnail: z.boolean().meta({ example: true }).optional(),
});
export type ProgramImage = z.infer<typeof programImageSchema>;

// ─── 프로그램 상세 (GET /stores/{slug}/programs/{programId}) ─────
export const programDetailSchema = z.object({
    id: z.string().meta({ example: 'program-uuid-001' }),
    storeId: z.string().meta({ example: 'store-uuid-001' }),
    title: z.string().meta({ example: '물레 체험 기초반' }),
    description: z
        .string()
        .meta({ example: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.' })
        .nullable(),
    materials: z.string().meta({ example: '앞치마 (공방 제공), 편한 복장' }).nullable().optional(),
    price: z.number().meta({ example: 45000 }),
    durationMinutes: z.number().meta({ example: 120 }),
    leadTimeDays: z.number().meta({ example: 30 }),
    difficulty: z
        .nativeEnum(ProgramDifficulty)
        .meta({ example: ProgramDifficulty.BASIC })
        .optional(),
    childFriendly: z.boolean().meta({ example: false }),
    deliverable: z.boolean().meta({ example: true }),
    status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.ACTIVE }),
    images: z.array(programImageSchema),
});
export type ProgramDetail = z.infer<typeof programDetailSchema>;

export const programDetailResultSchema = z.object({
    program: programDetailSchema,
});
export type ProgramDetailResult = z.infer<typeof programDetailResultSchema>;

// ─── PATCH /partner/stores/{storeId}/programs/{programId} ────────
export const programEditRequestSchema = z.object({
    title: z
        .string()
        .min(2, '클래스명은 2자 이상이어야 합니다.')
        .max(60, '클래스명은 60자 이하여야 합니다.')
        .meta({ example: '물레 체험 기초반 (개정)' })
        .optional(),
    description: z
        .string()
        .max(1000, '상세 설명은 1000자 이하여야 합니다.')
        .meta({ example: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.' })
        .nullable()
        .optional(),
    materials: z.string().meta({ example: '앞치마 (공방 제공), 편한 복장' }).nullable().optional(),
    caution: z
        .string()
        .meta({ example: '체험 2시간 전까지 취소 가능합니다.' })
        .nullable()
        .optional(),
    difficulty: z
        .nativeEnum(ProgramDifficulty, {
            error: '난이도는 BASIC, INTERMEDIATE, ADVANCED 중 하나여야 합니다.',
        })
        .meta({ example: ProgramDifficulty.BASIC })
        .optional(),
    price: z
        .number()
        .int('가격은 정수여야 합니다.')
        .positive('가격은 양의 정수여야 합니다.')
        .meta({ example: 48000, description: '양의 정수 (원 단위)' })
        .optional(),
    leadTimeDays: z
        .number()
        .int('리드타임은 정수여야 합니다.')
        .min(0, '리드타임은 0일 이상이어야 합니다.')
        .meta({ example: 30, description: '0일 이상' })
        .optional(),
    // 30~480분 (createProgramRequestSchema 와 동일 바운드).
    durationMinutes: z
        .number()
        .int('소요시간은 정수여야 합니다.')
        .min(30, '소요시간은 30분 이상이어야 합니다.')
        .max(480, '소요시간은 480분 이하여야 합니다.')
        .meta({ example: 120, description: '30~480분' })
        .optional(),
    childFriendly: z
        .boolean()
        .meta({ example: true, description: '어린이 동반 가능 여부' })
        .optional(),
    deliverable: z
        .boolean()
        .meta({ example: false, description: '택배 배송 가능 여부' })
        .optional(),
});
export type ProgramEditRequest = z.infer<typeof programEditRequestSchema>;

export const programEditResultSchema = z.object({
    program: z.object({
        id: z.string().meta({ example: 'program-uuid-001' }),
        title: z.string().meta({ example: '물레 체험 기초반 (개정)' }),
        price: z.number().meta({ example: 48000 }),
        status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.ACTIVE }),
        updatedAt: z.string().meta({ example: '2026-06-05T14:00:00.000Z' }),
    }),
});
export type ProgramEditResult = z.infer<typeof programEditResultSchema>;

// ─── POST /partner/stores/{storeId}/programs/{programId}/images ──
export const programImageUploadRequestSchema = z.object({
    fileName: z.string().meta({ example: 'program_01.png' }),
    fileType: z.string().meta({ example: 'image/png', description: '지원 형식: JPG, PNG, HEIC' }),
    isThumbnail: z.boolean().meta({ example: true }),
});
export type ProgramImageUploadRequest = z.infer<typeof programImageUploadRequestSchema>;

export const programImageUploadResultSchema = z.object({
    programImageId: z.string().meta({ example: 'program-image-uuid-001' }),
    uploadUrl: z.string().meta({ example: 'https://s3.ap-northeast-2.amazonaws.com/upload-url' }),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.app/programs/program_01.png' }),
});
export type ProgramImageUploadResult = z.infer<typeof programImageUploadResultSchema>;
