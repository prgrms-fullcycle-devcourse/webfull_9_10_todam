import { z } from 'zod';

// 정본(API명세) 기준. 예약자 필드는 D2 확정 전까지 미포함.

export const userProfileSchema = z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    isPartner: z.boolean(),
    createdAt: z.string().datetime().optional(), // GET 응답
    updatedAt: z.string().datetime().optional(), // PATCH 응답
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const getMyProfileResponseSchema = z.object({ user: userProfileSchema });
export type GetMyProfileResponse = z.infer<typeof getMyProfileResponseSchema>;

// 닉네임 정책: 공백 제외 2~10자, 특수문자 불가 (정본). 정규식 D5에서 확정.
export const updateMyProfileBodySchema = z.object({
    nickname: z.string().trim().min(2).max(10), // .regex(...) D5
});
export type UpdateMyProfileBody = z.infer<typeof updateMyProfileBodySchema>;

export const updateMyProfileResponseSchema = z.object({ user: userProfileSchema });
export type UpdateMyProfileResponse = z.infer<typeof updateMyProfileResponseSchema>;

export const notificationSettingsSchema = z.object({
    id: z.string(),
    userId: z.string().uuid(),
    inAppEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    kakaoEnabled: z.boolean(),
    reservationEnabled: z.boolean(),
    artworkEnabled: z.boolean(),
    shippingEnabled: z.boolean(),
    marketingEnabled: z.boolean(),
    updatedAt: z.string().datetime(),
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const getNotificationSettingsResponseSchema = z.object({
    notificationSettings: notificationSettingsSchema,
});
export type GetNotificationSettingsResponse = z.infer<typeof getNotificationSettingsResponseSchema>;

// PATCH /users/me/notification-settings 요청 body (토글 2개만 — 마이페이지 허브 scope)
export const patchNotificationSettingsBodySchema = z.object({
    artworkEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
});
export type PatchNotificationSettingsBody = z.infer<typeof patchNotificationSettingsBodySchema>;

export const patchNotificationSettingsResponseSchema = z.object({
    notificationSettings: notificationSettingsSchema,
});
export type PatchNotificationSettingsResponse = z.infer<
    typeof patchNotificationSettingsResponseSchema
>;
