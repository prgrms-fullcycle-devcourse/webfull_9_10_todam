// 타임슬롯/제한의 절대 시각 계산 유틸 (순수 — DB/Nest 비의존, 도메인 계층).
//
// 영업시간(StoreOperatingHour)의 openTime/closeTime/breakStart/breakEnd 는
// @db.Time(6) 컬럼이며 CreateStoreUseCase 에서 setUTCHours 로 저장된다 →
// 즉 1970-01-01 의 "UTC 시:분" 이 곧 매장 벽시계(한국시간, KST=UTC+9) 시:분이다.
//
// 슬롯/제한의 startAt/endAt 은 Timestamptz 절대 시각이므로,
// 특정 날짜(date, YYYY-MM-DD, KST 기준)의 벽시계 시:분을 KST 로 해석해 UTC instant 로 변환한다.
// 한국은 서머타임이 없어 고정 +9 오프셋으로 안전하다.

export const KST_OFFSET_MINUTES = 9 * 60;

/** db.Time 값(1970-01-01 UTC HH:mm)에서 벽시계 분(0~1439)을 얻는다. */
export function timeColumnToMinutes(value: Date): number {
    return value.getUTCHours() * 60 + value.getUTCMinutes();
}

/** YYYY-MM-DD 형식 검증 후 [year, month(1-12), day] 반환. 잘못된 형식이면 null. */
export function parseDateOnly(date: string): { year: number; month: number; day: number } | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    // 실제 존재하는 날짜인지(예: 2026-02-30) 확인.
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

/**
 * KST 날짜(date) + 벽시계 분(minutesOfDay) → UTC 절대 시각(Date).
 * 예: 2026-06-10, 09:00(KST) → 2026-06-10T00:00:00Z.
 */
export function kstWallClockToInstant(
    parts: { year: number; month: number; day: number },
    minutesOfDay: number,
): Date {
    const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
    // 벽시계(KST)에서 UTC instant 로 가려면 오프셋(+9h)을 뺀다.
    return new Date(utcMillis + (minutesOfDay - KST_OFFSET_MINUTES) * 60 * 1000);
}

/** Prisma DayOfWeek enum 값(MON..SUN) — KST 날짜 기준 요일. */
const DAY_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export type DayOfWeekValue = (typeof DAY_OF_WEEK)[number];

/** KST 날짜의 요일(MON..SUN)을 구한다. */
export function kstDayOfWeek(parts: { year: number; month: number; day: number }): DayOfWeekValue {
    // 자정 KST instant 의 요일 = 그 날짜의 요일.
    const instant = kstWallClockToInstant(parts, 0);
    // instant 를 다시 KST 벽시계로 보고 요일 계산.
    const kst = new Date(instant.getTime() + KST_OFFSET_MINUTES * 60 * 1000);
    return DAY_OF_WEEK[kst.getUTCDay()]!;
}

/** date(YYYY-MM-DD, KST) 의 하루 [start, end) 절대 시각 범위. */
export function kstDayRange(parts: { year: number; month: number; day: number }): {
    start: Date;
    end: Date;
} {
    const start = kstWallClockToInstant(parts, 0);
    const end = kstWallClockToInstant(parts, 24 * 60);
    return { start, end };
}

/** year/month(KST) 의 해당 월 [1일 00:00, 다음달 1일 00:00) 절대 시각 범위. */
export function kstMonthRange(year: number, month: number): { start: Date; end: Date } {
    const start = kstWallClockToInstant({ year, month, day: 1 }, 0);
    const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    const end = kstWallClockToInstant({ year: next.year, month: next.month, day: 1 }, 0);
    return { start, end };
}

/** 두 날짜(YYYY-MM-DD) 사이의 모든 날짜 parts 를 포함(양끝 포함)해 반환. */
export function eachDateInclusive(
    startParts: { year: number; month: number; day: number },
    endParts: { year: number; month: number; day: number },
): { year: number; month: number; day: number }[] {
    const result: { year: number; month: number; day: number }[] = [];
    let cursor = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
    const last = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
    while (cursor <= last) {
        const d = new Date(cursor);
        result.push({
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
        });
        cursor += 24 * 60 * 60 * 1000;
    }
    return result;
}
