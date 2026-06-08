// 날짜(ISO8601) → 화면용 표시 문자열.
// Asia/Seoul 기준 표시 가정 (서버가 ISO Z 로 내려주므로 로컬 변환 = 한국 환경 기본 정합).
// format-scheduled 와 동일한 가정. 잘못된 입력은 '' 반환 → 호출부에서 `|| '-'` 등으로 폴백.

export const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const pad = (n: number): string => String(n).padStart(2, '0');

function parseDateKey(dateKey: string): Date | null {
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!year || !month || !day) return null;

    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        return null;
    }

    return d;
}

export function formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getTodayDateKey(): string {
    return formatDateKey(new Date());
}

export function formatKoreanMonthDayWithWeekday(dateKey: string): string {
    const d = parseDateKey(dateKey);
    if (!d) return '';

    const day = DAYS[d.getDay()] ?? '';
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`;
}

export function isFutureDateKey(dateKey: string): boolean {
    const d = parseDateKey(dateKey);
    if (!d) return false;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d.getTime() > todayStart.getTime();
}

// "YYYY. MM. DD" (예: "2026. 06. 18")
export function formatYmd(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}`;
}

// "YYYY. MM. DD (요일)" (예: "2026. 06. 18 (목)")
export function formatYmdWithDay(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const day = DAYS[d.getDay()] ?? '';
    return `${formatYmd(iso)} (${day})`;
}

// "YYYY. MM. DD HH:mm" (예: "2026. 06. 18 15:00")
export function formatYmdHm(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${formatYmd(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YY.MM.DD" (예: "26.06.18")
export function formatYmdShort(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getFullYear()).slice(-2)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
