import {
    currentKstDayRange,
    formatKstDate,
    kstDayRange,
    kstMonthRange,
    parseDateOnly,
} from './kst-date.util';

describe('KST date utilities', () => {
    it('rejects invalid calendar dates', () => {
        expect(parseDateOnly('2026-02-30')).toBeNull();
        expect(parseDateOnly('2026-06-08')).toEqual({ year: 2026, month: 6, day: 8 });
    });

    it('converts a KST date to a UTC instant range', () => {
        expect(kstDayRange({ year: 2026, month: 6, day: 8 })).toEqual({
            start: new Date('2026-06-07T15:00:00.000Z'),
            end: new Date('2026-06-08T15:00:00.000Z'),
        });
    });

    it('handles current day and month boundaries in KST', () => {
        expect(currentKstDayRange(new Date('2026-06-08T16:00:00.000Z'))).toEqual({
            start: new Date('2026-06-08T15:00:00.000Z'),
            end: new Date('2026-06-09T15:00:00.000Z'),
        });
        expect(kstMonthRange(2026, 12)).toEqual({
            start: new Date('2026-11-30T15:00:00.000Z'),
            end: new Date('2026-12-31T15:00:00.000Z'),
        });
    });

    it('formats an instant as a KST date', () => {
        expect(formatKstDate(new Date('2026-06-08T15:00:00.000Z'))).toBe('2026-06-09');
    });
});
