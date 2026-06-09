import { z } from 'zod';

import { StoreStatus } from '../enums/store-status';
import { ProgramDifficulty } from '../enums/program-difficulty';
import { ProgramStatus } from '../enums/program-status';

// ─── 공방 상세 조회 (퍼블릭) ──────────────────────────────────────
// GET /stores/{slug} (OptionalAuth — 비인증 시 isFavorite=false)
// API Contract 스냅샷: docs/exec-plans/active/user-공방-상세.md § Contract A

export const storeDetailImageSchema = z.object({
    imageUrl: z.string(),
    thumbnailUrl: z.string(),
});
export type StoreDetailImage = z.infer<typeof storeDetailImageSchema>;

export const storeDetailLocationSchema = z.object({
    lat: z.number(),
    lng: z.number(),
});
export type StoreDetailLocation = z.infer<typeof storeDetailLocationSchema>;

export const convenienceInfoDetailSchema = z.object({
    parking: z.boolean(),
    pet: z.boolean(),
    wifi: z.boolean(),
});

export const storeDetailSchema = z.object({
    id: z.string(),
    partnerId: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    phone: z.string(),
    address: z.string(),
    status: z.nativeEnum(StoreStatus),
    convenienceInfo: convenienceInfoDetailSchema,
    autoConfirm: z.boolean(),
    publishedAt: z.string(),
    images: z.array(storeDetailImageSchema),
    rating: z.number().nullable(),
    reviewCount: z.number(),
    location: storeDetailLocationSchema,
    isFavorite: z.boolean(),
});
export type StoreDetail = z.infer<typeof storeDetailSchema>;

export const storeDetailResultSchema = z.object({
    store: storeDetailSchema,
});
export type StoreDetailResult = z.infer<typeof storeDetailResultSchema>;

// ─── 퍼블릭 프로그램 목록 ─────────────────────────────────────────
// GET /stores/{slug}/programs (퍼블릭, ACTIVE 만)
// API Contract 스냅샷: docs/exec-plans/active/user-공방-상세.md § Contract B

export const publicProgramListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    difficulty: z.nativeEnum(ProgramDifficulty),
    description: z.string(),
    price: z.number(),
    durationMinutes: z.number(),
    leadTimeDays: z.number(),
    deliverable: z.boolean(),
    thumbnailUrl: z.string().nullable(),
    status: z.literal(ProgramStatus.ACTIVE),
    sortOrder: z.number(),
});
export type PublicProgramListItem = z.infer<typeof publicProgramListItemSchema>;

export const publicProgramListResultSchema = z.object({
    programs: z.array(publicProgramListItemSchema),
});
export type PublicProgramListResult = z.infer<typeof publicProgramListResultSchema>;
