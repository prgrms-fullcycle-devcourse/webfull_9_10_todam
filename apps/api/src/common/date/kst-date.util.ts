export const KST_OFFSET_MINUTES = 9 * 60;

export interface DateParts {
    year: number;
    month: number;
    day: number;
}

export function toKstWallClock(value: Date): Date {
    return new Date(value.getTime() + KST_OFFSET_MINUTES * 60 * 1000);
}

export function parseDateOnly(value: string): DateParts | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
        probe.getUTCFullYear() !== year ||
        probe.getUTCMonth() !== month - 1 ||
        probe.getUTCDate() !== day
    ) {
        return null;
    }

    return { year, month, day };
}

export function kstWallClockToInstant(parts: DateParts, minutesOfDay: number): Date {
    const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day);
    return new Date(utcMillis + (minutesOfDay - KST_OFFSET_MINUTES) * 60 * 1000);
}

export function kstDayRange(parts: DateParts): { start: Date; end: Date } {
    return {
        start: kstWallClockToInstant(parts, 0),
        end: kstWallClockToInstant(parts, 24 * 60),
    };
}

export function currentKstDayRange(now = new Date()): { start: Date; end: Date } {
    const kst = toKstWallClock(now);
    return kstDayRange({
        year: kst.getUTCFullYear(),
        month: kst.getUTCMonth() + 1,
        day: kst.getUTCDate(),
    });
}

export function kstMonthRange(year: number, month: number): { start: Date; end: Date } {
    const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    return {
        start: kstWallClockToInstant({ year, month, day: 1 }, 0),
        end: kstWallClockToInstant({ year: next.year, month: next.month, day: 1 }, 0),
    };
}

export function formatKstDate(value: Date): string {
    const kst = toKstWallClock(value);
    const year = kst.getUTCFullYear();
    const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kst.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const DAY_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export type DayOfWeekValue = (typeof DAY_OF_WEEK)[number];

export function kstDayOfWeek(value: DateParts | string): DayOfWeekValue {
    const parts = typeof value === 'string' ? parseDateOnly(value) : value;
    if (!parts) throw new Error('Invalid date');
    const instant = kstWallClockToInstant(parts, 0);
    const kst = toKstWallClock(instant);
    return DAY_OF_WEEK[kst.getUTCDay()]!;
}

export function eachDateInclusive(startParts: DateParts, endParts: DateParts): DateParts[] {
    const result: DateParts[] = [];
    let cursor = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
    const last = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
    while (cursor <= last) {
        const date = new Date(cursor);
        result.push({
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
        });
        cursor += 24 * 60 * 60 * 1000;
    }
    return result;
}

export function eachMonthDate(year: number, month: number): string[] {
    const days: string[] = [];
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= lastDay; day += 1) {
        days.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    return days;
}
