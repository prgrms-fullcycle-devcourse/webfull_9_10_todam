import { format } from 'date-fns';

// ISO 문자열 → yyyy.MM.dd. 파싱 불가 시 원문 반환.
export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return format(date, 'yyyy.MM.dd');
}

// ISO 문자열 → yyyy.MM.dd HH:mm.
export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '-';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return format(date, 'yyyy.MM.dd HH:mm');
}

// YYYYMMDD(사업자 개업일자) → yyyy.MM.dd.
export function formatYmd(ymd: string | null | undefined): string {
    if (!ymd || ymd.length !== 8) return ymd ?? '-';
    return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`;
}
