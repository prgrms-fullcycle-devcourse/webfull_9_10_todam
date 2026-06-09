export const KST_OFFSET_MINUTES = 9 * 60;

/** Date → KST 기준 YYYYMMDD 정수 (날짜 대소 비교 전용) */
export function toKSTDateNum(date: Date): number {
    const kst = new Date(date.getTime() + KST_OFFSET_MINUTES * 60 * 1000);
    return kst.getUTCFullYear() * 10000 + (kst.getUTCMonth() + 1) * 100 + kst.getUTCDate();
}

/** YYYYMMDD 정수에서 days일을 뺀 YYYYMMDD 정수 반환 */
export function subDaysNum(baseDateNum: number, days: number): number {
    const year = Math.floor(baseDateNum / 10000);
    const month = Math.floor((baseDateNum % 10000) / 100) - 1;
    const day = baseDateNum % 100;
    const d = new Date(Date.UTC(year, month, day));
    d.setUTCDate(d.getUTCDate() - days);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

export function parseDateOnly(value: string): { year: number; month: number; day: number } | null {
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

export function kstDayRange(parts: { year: number; month: number; day: number }): {
    start: Date;
    end: Date;
} {
    const start = new Date(
        Date.UTC(parts.year, parts.month - 1, parts.day) - KST_OFFSET_MINUTES * 60 * 1000,
    );
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}

export function kstMonthRange(year: number, month: number): { start: Date; end: Date } {
    return {
        start: new Date(Date.UTC(year, month - 1, 1) - KST_OFFSET_MINUTES * 60 * 1000),
        end: new Date(Date.UTC(year, month, 1) - KST_OFFSET_MINUTES * 60 * 1000),
    };
}

export function formatKstDate(value: Date): string {
    const kst = new Date(value.getTime() + KST_OFFSET_MINUTES * 60 * 1000);
    const year = kst.getUTCFullYear();
    const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kst.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const DAY_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export function kstDayOfWeek(date: string): (typeof DAY_OF_WEEK)[number] {
    const parts = parseDateOnly(date);
    if (!parts) throw new Error('Invalid date');

    const kst = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    return DAY_OF_WEEK[kst.getUTCDay()]!;
}

export function eachMonthDate(year: number, month: number): string[] {
    const days: string[] = [];
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= lastDay; day += 1) {
        days.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    return days;
}
