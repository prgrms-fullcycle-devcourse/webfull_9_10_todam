import { StoreListPolicy } from './store-list-policy.service';

const time = (hours: number, minutes = 0): Date => {
    const value = new Date(0);
    value.setUTCHours(hours, minutes, 0, 0);
    return value;
};

describe('StoreListPolicy', () => {
    it('returns infinity when store coordinates are missing', () => {
        expect(StoreListPolicy.distanceMeters(37.5, 127, { latitude: null, longitude: null })).toBe(
            Number.POSITIVE_INFINITY,
        );
    });

    it('selects the cheapest program with stable tie-breakers', () => {
        const selected = StoreListPolicy.cheapest([
            { id: 'b', price: 1000, sortOrder: 1 },
            { id: 'a', price: 1000, sortOrder: 1 },
            { id: 'c', price: 2000, sortOrder: 0 },
        ]);

        expect(selected.id).toBe('a');
    });

    it('excludes break time from operating hours', () => {
        const hours = [
            {
                dayOfWeek: 'MON',
                openTime: time(10),
                closeTime: time(19),
                breakStart: time(13),
                breakEnd: time(14),
            },
        ];

        expect(StoreListPolicy.isOperating(hours, new Date('2026-06-01T04:30:00.000Z'))).toBe(
            false,
        );
        expect(StoreListPolicy.isOperating(hours, new Date('2026-06-01T05:30:00.000Z'))).toBe(true);
    });
});
