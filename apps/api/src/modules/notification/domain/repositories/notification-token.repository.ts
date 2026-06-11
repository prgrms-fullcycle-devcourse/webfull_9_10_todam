// NotificationToken 도메인 Repository (port)
// 구현체: PrismaNotificationTokenRepository (infrastructure/persistence)

export interface NotificationTokenRow {
    id: string;
    userId: string;
    fcmToken: string;
    userAgent: string | null;
    createdAt: Date;
    revokedAt: Date | null;
}

export abstract class NotificationTokenRepository {
    /**
     * 동일 userId + fcmToken 이면 갱신(revokedAt=null 복구), 없으면 생성.
     * upsert 결과 레코드를 반환한다.
     */
    abstract upsert(params: {
        userId: string;
        fcmToken: string;
        userAgent?: string;
    }): Promise<NotificationTokenRow>;

    /**
     * 해당 userId + fcmToken 에 revokedAt=now() 기록.
     * 본인 소유가 아닌 경우 null 반환(컨트롤러에서 403 처리).
     */
    abstract revoke(params: {
        userId: string;
        fcmToken: string;
    }): Promise<NotificationTokenRow | null>;
}
