// 인앱 알림센터 목록 커서 코덱. (createdAt DESC, id DESC) 복합 커서.
// 페이지네이션 계약(도메인)이라 application/infrastructure 양쪽이 이 도메인 모듈을 의존한다.

export interface NotificationCursorPayload {
    createdAt: string; // ISO string
    id: string; // UUID
}

export function encodeCursor(payload: NotificationCursorPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor: string): NotificationCursorPayload | null {
    try {
        return JSON.parse(
            Buffer.from(cursor, 'base64url').toString('utf8'),
        ) as NotificationCursorPayload;
    } catch {
        return null;
    }
}
