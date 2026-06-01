import type { DayOfWeek } from '@todam/shared';

// 공방 operatingHours의 dayOfWeek(영문 enum) → 한글 요일 단축 표기.
// 순수 매핑(페치·라우팅 없음 → entities/store/model). day는 program 필드가 아니라
// store.operatingHours에서 도출하며, page에서 operatingDays 문자열을 만들어 ProgramListItem에 전달한다.
const DAY_OF_WEEK_LABEL: Record<DayOfWeek, string> = {
    SUN: '일',
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
    SAT: '토',
};

// 메타줄 구분자(가운뎃점)와 동일 문자 사용 — 클래스 카드 meta 일관성.
const DAY_SEPARATOR = '·';

export function getDayOfWeekLabel(dayOfWeek: DayOfWeek): string {
    return DAY_OF_WEEK_LABEL[dayOfWeek];
}

// operatingHours[].dayOfWeek 배열을 한글 요일로 매핑해 "·"로 join.
export function formatOperatingDays(days: readonly DayOfWeek[]): string {
    return days.map(getDayOfWeekLabel).join(DAY_SEPARATOR);
}
