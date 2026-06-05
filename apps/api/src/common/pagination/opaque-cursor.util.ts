export function encodeOpaqueCursor<T>(payload: T): string {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeOpaqueCursor(cursor: string): Record<string, unknown> | null {
    try {
        const json = Buffer.from(cursor, 'base64url').toString('utf8');
        const parsed: unknown = JSON.parse(json);
        return isRecord(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
