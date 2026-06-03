// 예약 일정(ISO8601) → 화면용 표시 파츠.
// Asia/Seoul 기준 표시 가정 (서버가 ISO Z 로 내려주므로 로컬 변환 = 한국 환경 기본 정합).
// 다른 엔드포인트의 예약 카드/리스트에서 재사용.

import { DAYS } from './date';

export type ScheduledParts = {
    /** 월.일 (예: "6.18") */
    date: string;
    /** 요일 한글 한 글자 (예: "토") */
    day: string;
    /** 24시간제 HH:mm (예: "15:00") */
    time: string;
};

export function formatScheduled(iso: string): ScheduledParts {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: '', day: '', time: '' };
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const day = DAYS[d.getDay()] ?? '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { date: `${month}.${date}`, day, time: `${hh}:${mm}` };
}
