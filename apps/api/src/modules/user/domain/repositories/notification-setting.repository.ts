// NotificationSetting 도메인 Repository (port) — user 모듈 소유
// 구현체: PrismaNotificationSettingRepository (infrastructure/persistence)

export interface NotificationSettingRow {
    id: string;
    userId: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    kakaoEnabled: boolean;
    webPushEnabled: boolean;
    reservationEnabled: boolean;
    artworkEnabled: boolean;
    shippingEnabled: boolean;
    marketingEnabled: boolean;
    updatedAt: Date;
}

/** 업데이트 가능한 필드 — 모두 optional */
export interface NotificationSettingPatchInput {
    inAppEnabled?: boolean;
    emailEnabled?: boolean;
    kakaoEnabled?: boolean;
    webPushEnabled?: boolean;
    reservationEnabled?: boolean;
    artworkEnabled?: boolean;
    shippingEnabled?: boolean;
    marketingEnabled?: boolean;
}

export abstract class NotificationSettingRepository {
    /**
     * userId로 알림 설정 조회.
     * 레코드 없으면 기본값으로 새 레코드 생성 후 반환(lazy-default).
     */
    abstract findOrCreateByUserId(userId: string): Promise<NotificationSettingRow>;

    /**
     * 알림 설정 partial 업데이트.
     * 레코드 없으면 기본값으로 생성 후 적용.
     * 빈 객체({})가 들어오면 현재 설정을 변경 없이 반환(no-op).
     */
    abstract upsertPatch(
        userId: string,
        patch: NotificationSettingPatchInput,
    ): Promise<NotificationSettingRow>;
}
