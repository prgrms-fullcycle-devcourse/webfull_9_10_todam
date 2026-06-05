import { decodeOpaqueCursor, encodeOpaqueCursor } from './opaque-cursor.util';

describe('opaque cursor', () => {
    it('round-trips object payloads', () => {
        const payload = { id: 'store-1', createdAt: '2026-06-05T00:00:00.000Z' };

        expect(decodeOpaqueCursor(encodeOpaqueCursor(payload))).toEqual(payload);
    });

    it.each(['not-base64', encodeOpaqueCursor(['store-1']), encodeOpaqueCursor(null)])(
        'rejects invalid payload %s',
        (cursor) => {
            expect(decodeOpaqueCursor(cursor)).toBeNull();
        },
    );
});
