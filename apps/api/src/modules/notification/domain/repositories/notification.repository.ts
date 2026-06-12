// Notification 도메인 Repository (port)
// 구현체: PrismaNotificationRepository (infrastructure/persistence)
// Phase 3a: 인앱 알림센터 CRUD

export interface NotificationRow {
    id: string;
    userId: string;
    eventType: string;
    category: 'TRANSACTION' | 'ARTWORK' | 'DELIVERY' | 'OPERATION' | 'ENGAGEMENT';
    title: string;
    body: string;
    deepLink: string | null;
    idempotencyKey: string;
    readAt: Date | null;
    createdAt: Date;
}

export abstract class NotificationRepository {
    /**
     * 본인 알림 커서 페이지네이션 목록 조회.
     * cursor: base64 encoded JSON { createdAt: ISO, id: UUID } — stable sort 보장
     * limit: 최대 100
     * unreadOnly: readAt IS NULL 필터
     * 반환: 레코드 배열 + 미읽음 전체 카운트
     */
    abstract listByUser(params: {
        userId: string;
        cursor?: string;
        limit: number;
        unreadOnly?: boolean;
    }): Promise<{ notifications: NotificationRow[]; unreadCount: number }>;

    /**
     * 단건 조회 (소유권 확인용).
     */
    abstract findById(id: string): Promise<NotificationRow | null>;

    /**
     * 단건 읽음 처리 — readAt = now().
     */
    abstract markRead(id: string): Promise<NotificationRow>;

    /**
     * 본인 미읽음 전체 읽음 처리.
     * 반환: 갱신된 레코드 수
     */
    abstract markAllRead(userId: string): Promise<number>;
}
