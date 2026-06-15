import { z } from 'zod';

// 정본(API명세) 기준. 예약자 필드는 D2 확정(Reservation 모델 소속) — users/me 범위 밖.

export const userProfileSchema = z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    isPartner: z.boolean(),
    createdAt: z.string().datetime().optional(), // GET 응답
    updatedAt: z.string().datetime().optional(), // PATCH 응답
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// GET /users/me 응답 user 객체 — createdAt 포함, updatedAt 없음
export const getMyProfileUserSchema = z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    isPartner: z.boolean(),
    hasPassword: z.boolean(),
    createdAt: z.string().datetime(),
});
export type GetMyProfileUser = z.infer<typeof getMyProfileUserSchema>;

// PATCH /users/me 응답 user 객체 — updatedAt 포함, createdAt 없음
export const updateMyProfileUserSchema = z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    isPartner: z.boolean(),
    updatedAt: z.string().datetime(),
});
export type UpdateMyProfileUser = z.infer<typeof updateMyProfileUserSchema>;

export const getMyProfileResponseSchema = z.object({ user: getMyProfileUserSchema });
export type GetMyProfileResponse = z.infer<typeof getMyProfileResponseSchema>;

// 닉네임 정책 (D5 확정 2026-06-09):
//   한글 완성형(가-힣)·영문(a-zA-Z)·숫자(0-9)만 허용, 2~10자.
//   자모 단독(ㄱ,ㅏ 등) 불가, 공백 불가, 특수문자 불가.
//   정규식: /^[가-힣a-zA-Z0-9]{2,10}$/
//   에러 메시지: "닉네임은 한글·영문·숫자 2~10자여야 합니다."
//
//   Note(follow-up): auth.ts signupRequestSchema 닉네임은 현재 max(100), regex 미적용.
//   회원가입 닉네임 규칙을 동일하게 통일하는 것은 auth 도메인 별도 follow-up.
//   통일 전까지 "가입은 최대 100자, 수정은 2~10자" UX 불일치 잔존.
export const nicknameSchema = z
    .string()
    .regex(/^[가-힣a-zA-Z0-9]{2,10}$/, '닉네임은 한글·영문·숫자 2~10자여야 합니다.');

export const updateMyProfileBodySchema = z.object({
    nickname: nicknameSchema,
});
export type UpdateMyProfileBody = z.infer<typeof updateMyProfileBodySchema>;

export const updateMyProfileResponseSchema = z.object({ user: updateMyProfileUserSchema });
export type UpdateMyProfileResponse = z.infer<typeof updateMyProfileResponseSchema>;

export const notificationSettingsSchema = z.object({
    id: z.string(),
    userId: z.string().uuid(),
    inAppEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    kakaoEnabled: z.boolean(),
    webPushEnabled: z.boolean(), // 푸시 알림 Web Push 채널 on/off (#315)
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

// PATCH /users/me/notification-settings 요청 body — FE scope (마이페이지 허브 토글)
// FE는 artworkEnabled·marketingEnabled·webPushEnabled 전송.
export const patchNotificationSettingsBodySchema = z.object({
    artworkEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
    webPushEnabled: z.boolean().optional(), // Web Push 채널 on/off (#316)
});
export type PatchNotificationSettingsBody = z.infer<typeof patchNotificationSettingsBodySchema>;

// PATCH /users/me/notification-settings 요청 body — BE scope (D10 확정 2026-06-09)
// BE DTO는 7필드 all-optional partial 지원. 빈 객체({})는 no-op으로 처리(400 대신 변경 없이 현재 설정 반환).
// 소유권: user 모듈 (D6 확정 2026-06-09).
export const patchNotificationSettingsAllFieldsBodySchema = z.object({
    inAppEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    kakaoEnabled: z.boolean().optional(),
    webPushEnabled: z.boolean().optional(), // 푸시 알림 Web Push 채널 (#315)
    reservationEnabled: z.boolean().optional(),
    artworkEnabled: z.boolean().optional(),
    shippingEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
});
export type PatchNotificationSettingsAllFieldsBody = z.infer<
    typeof patchNotificationSettingsAllFieldsBodySchema
>;

// DELETE /users/me — 회원탈퇴 요청 body
// 소셜 유저는 password 없이 요청 가능(optional). 이메일 유저는 password 필수(use-case에서 검증).
export const withdrawBodySchema = z.preprocess(
    (body) => body ?? {},
    z.object({
        password: z.string().min(1).optional(),
    }),
);
export type WithdrawBody = z.infer<typeof withdrawBodySchema>;

// DELETE /users/me 에러코드 (contract 기준)
export const WithdrawErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    ACTIVE_PARTNER_EXISTS: 'ACTIVE_PARTNER_EXISTS',
    ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST: 'ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST',
    PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type WithdrawErrorCode = (typeof WithdrawErrorCode)[keyof typeof WithdrawErrorCode];

// PATCH /users/me 에러코드 (contract 기준)
export const UpdateMyProfileErrorCode = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    NICKNAME_ALREADY_EXISTS: 'NICKNAME_ALREADY_EXISTS',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type UpdateMyProfileErrorCode =
    (typeof UpdateMyProfileErrorCode)[keyof typeof UpdateMyProfileErrorCode];

export const patchNotificationSettingsResponseSchema = z.object({
    notificationSettings: notificationSettingsSchema,
});
export type PatchNotificationSettingsResponse = z.infer<
    typeof patchNotificationSettingsResponseSchema
>;
