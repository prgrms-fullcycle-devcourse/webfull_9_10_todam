// GET /stores 커서 인코딩/디코딩 (opaque, base64url).
// 정렬키 분기:
//  - lat/lng 있으면 { distance, id } (거리순 + id tie-break)
//  - 없으면 { publishedAt, id } (최신 공개순 + id tie-break)
// contract: Open decisions #3.

export interface DistanceCursor {
    distance: number; // 미터(정수)
    id: string;
}

export interface PublishedAtCursor {
    publishedAt: string; // ISO
    id: string;
}

export type StoreCursorPayload = DistanceCursor | PublishedAtCursor;

export function encodeCursor(payload: StoreCursorPayload): string {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): StoreCursorPayload | null {
    try {
        const json = Buffer.from(cursor, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as Record<string, unknown>;
        if (typeof parsed.id !== 'string') {
            return null;
        }
        if (typeof parsed.distance === 'number') {
            return { distance: parsed.distance, id: parsed.id };
        }
        if (typeof parsed.publishedAt === 'string') {
            return { publishedAt: parsed.publishedAt, id: parsed.id };
        }
        return null;
    } catch {
        return null;
    }
}

export function isDistanceCursor(payload: StoreCursorPayload): payload is DistanceCursor {
    return typeof (payload as DistanceCursor).distance === 'number';
}
