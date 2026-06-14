/// <reference types="jest" />
import { reservationRestrictionTimeRangeSchema } from '@todam/shared';

describe('reservationRestrictionTimeRangeSchema', () => {
    it('accepts a time range whose start is before its end', () => {
        expect(
            reservationRestrictionTimeRangeSchema.safeParse({
                startAt: '2026-06-10T10:00:00+09:00',
                endAt: '2026-06-10T12:00:00+09:00',
            }).success,
        ).toBe(true);
    });

    it.each([
        ['equal', '2026-06-10T10:00:00+09:00', '2026-06-10T10:00:00+09:00'],
        ['reversed', '2026-06-10T12:00:00+09:00', '2026-06-10T10:00:00+09:00'],
    ])('rejects an %s time range', (_case, startAt, endAt) => {
        expect(reservationRestrictionTimeRangeSchema.safeParse({ startAt, endAt }).success).toBe(
            false,
        );
    });
});
