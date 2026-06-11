import { z } from 'zod';

// 푸시 알림 contract (SSOT). plan: docs/exec-plans/active/push-notification.md API Contract 스냅샷 기준.
// Phase 2: 토큰 등록/revoke. Phase 3: 인앱 알림센터(목록/읽음).
// 옵트아웃(카테고리/채널 토글)은 user-me.ts notificationSettings로 통합 — 여기 정의하지 않음.

// 알림 카테고리 (정책 §4·§5). 기존 notification-channel/type enum과 별개 — 푸시 도메인 분류.
export const notificationCategorySchema = z.enum([
    'TRANSACTION', // 예약 확정/취소 등 거래
    'ARTWORK', // 작품 단계 (건조→소성→완성)
    'DELIVERY', // 배송·픽업
    'OPERATION', // 파트너 운영 (신규예약·심사결과)
    'ENGAGEMENT', // 리뷰요청 등 참여 유도
]);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

// 발송 채널 — MVP 단일 WEB_PUSH.
export const notificationDeliveryChannelSchema = z.enum(['WEB_PUSH']);
export type NotificationDeliveryChannel = z.infer<typeof notificationDeliveryChannelSchema>;

// 발송 상태.
export const notificationDeliveryStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED']);
export type NotificationDeliveryStatus = z.infer<typeof notificationDeliveryStatusSchema>;

// ── 엔티티 ──────────────────────────────────────────────

// NotificationToken — 사용자 기기/브라우저별 FCM 토큰.
export const notificationTokenSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    fcmToken: z.string(),
    userAgent: z.string().optional(),
    createdAt: z.string().datetime(),
    revokedAt: z.string().datetime().nullable(),
});
export type NotificationToken = z.infer<typeof notificationTokenSchema>;

// Notification — 인앱 알림 레코드 (채널 무관, 항상 생성).
export const notificationSchema = z.object({
    id: z.string().uuid(),
    recipientId: z.string().uuid(),
    eventType: z.string(), // 유즈케이스 코드 (U-1, P-1 등) — 정책 §4·§5
    category: notificationCategorySchema,
    title: z.string(),
    body: z.string(),
    deepLink: z.string().optional(),
    idempotencyKey: z.string(), // eventType + targetId + recipientId
    readAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;

// NotificationDelivery — 채널별 발송 시도 기록.
export const notificationDeliverySchema = z.object({
    id: z.string().uuid(),
    notificationId: z.string().uuid(),
    channel: notificationDeliveryChannelSchema,
    status: notificationDeliveryStatusSchema,
    attempts: z.number().int().nonnegative(),
    failedReason: z.string().nullable(),
    sentAt: z.string().datetime().nullable(),
});
export type NotificationDelivery = z.infer<typeof notificationDeliverySchema>;

// ── 엔드포인트 ──────────────────────────────────────────

// POST /notifications/tokens — FCM 토큰 등록/갱신(upsert).
export const registerNotificationTokenBodySchema = z.object({
    fcmToken: z.string().min(1),
    userAgent: z.string().optional(),
});
export type RegisterNotificationTokenBody = z.infer<typeof registerNotificationTokenBodySchema>;

export const registerNotificationTokenResponseSchema = z.object({
    token: notificationTokenSchema.pick({
        id: true,
        userId: true,
        fcmToken: true,
        createdAt: true,
    }),
});
export type RegisterNotificationTokenResponse = z.infer<
    typeof registerNotificationTokenResponseSchema
>;

// DELETE /notifications/tokens/:fcmToken — revoke (204 no body). 응답 스키마 없음.

// GET /notifications — 인앱 알림 목록 (커서 페이지네이션).
export const getNotificationsQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    unreadOnly: z.coerce.boolean().optional(),
});
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

export const getNotificationsResponseSchema = z.object({
    notifications: z.array(notificationSchema),
    nextCursor: z.string().nullable(),
    unreadCount: z.number().int().nonnegative(),
});
export type GetNotificationsResponse = z.infer<typeof getNotificationsResponseSchema>;

// PATCH /notifications/:id/read — 단건 읽음.
export const readNotificationResponseSchema = z.object({
    notification: z.object({
        id: z.string().uuid(),
        readAt: z.string().datetime(),
    }),
});
export type ReadNotificationResponse = z.infer<typeof readNotificationResponseSchema>;

// PATCH /notifications/read-all — 전체 읽음 일괄.
export const readAllNotificationsResponseSchema = z.object({
    updatedCount: z.number().int().nonnegative(),
});
export type ReadAllNotificationsResponse = z.infer<typeof readAllNotificationsResponseSchema>;
