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

// 12시간제 한 시각의 머리말(오전/오후)·시:분 파츠.
// formatScheduled 와 동일하게 로컬(=KST 가정) 변환을 사용한다.
function time12hParts(d: Date): { meridiem: string; hm: string } {
    const h24 = d.getHours();
    const meridiem = h24 < 12 ? '오전' : '오후';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { meridiem, hm: `${h12}:${mm}` };
}

export type ScheduledRangeParts = {
    /** 12시간제 시작 시각 (예: "오후 5:00") */
    start: string;
    /**
     * 12시간제 종료 시각. 시작과 오전/오후가 같으면 머리말을 생략해 "6:30",
     * 다르면 "오후 1:00" 처럼 머리말을 포함. 종료 시각이 없거나 파싱 불가하면 null.
     */
    end: string | null;
};

// 예약 시작·종료를 12시간제 파츠로 분리 반환(좁은 카드 등 줄바꿈 레이아웃용).
// 시작·종료의 오전/오후가 같으면 종료 머리말을 생략(텍스트 반복 제거).
// 종료 시각이 없거나 파싱 불가하면 end=null. 시작 파싱 불가하면 start='' .
export function formatScheduledRangeParts(
    startIso: string,
    endIso?: string | null,
): ScheduledRangeParts {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return { start: '', end: null };
    const s = time12hParts(start);
    const startText = `${s.meridiem} ${s.hm}`;
    if (!endIso) return { start: startText, end: null };
    const end = new Date(endIso);
    if (Number.isNaN(end.getTime())) return { start: startText, end: null };
    const e = time12hParts(end);
    // 같은 오전/오후면 종료의 머리말 생략 → "오후 5:00 ~ 6:30".
    const endText = s.meridiem === e.meridiem ? e.hm : `${e.meridiem} ${e.hm}`;
    return { start: startText, end: endText };
}

// 예약 시작~종료를 12시간제 범위 한 줄 문자열로 표기.
// 같은 오전/오후면 종료 머리말 생략 (예: "오후 5:00 ~ 6:30"),
// 바뀌면 둘 다 표시 (예: "오전 11:00 ~ 오후 1:00").
// 종료 시각이 없거나 파싱 불가하면 시작 시각만 반환해 안전하게 폴백한다.
// 시작 시각마저 파싱 불가하면 '' 반환 → 호출부에서 `|| '-'` 등으로 폴백.
export function formatScheduledRange(startIso: string, endIso?: string | null): string {
    const { start, end } = formatScheduledRangeParts(startIso, endIso);
    return end ? `${start} ~ ${end}` : start;
}
