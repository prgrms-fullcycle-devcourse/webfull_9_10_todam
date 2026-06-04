import type { GenerateTimeSlotsRequest, GenerateTimeSlotsResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/partner';

// 향후 자동 생성 롤링 일수 (#169 — 저장 시점 오늘 ~ 오늘+ROLLING_DAYS).
export const TIMESLOT_GENERATE_ROLLING_DAYS = 30;

// KST(Asia/Seoul) 기준 offsetDays 만큼 더한 날짜를 YYYY-MM-DD 로 반환.
// en-CA 로케일 → ISO(YYYY-MM-DD) 포맷. 서버 시간대와 무관하게 한국 날짜 격자 사용.
function kstDateString(offsetDays: number): string {
    const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(target);
}

// 저장 시점 기준 향후 ROLLING_DAYS 범위 날짜 구간. 과거 슬롯은 BE 가 자동 스킵.
export function rollingGenerateRange(): GenerateTimeSlotsRequest {
    return {
        startDate: kstDateString(0),
        endDate: kstDateString(TIMESLOT_GENERATE_ROLLING_DAYS),
    };
}

// POST /partner/stores/{storeId}/time-slots/generate — 영업시간·interval 기반 타임슬롯 자동 생성.
// 시간/간격/정원은 BE 가 공방 설정에서 조회. 멱등(이미 존재하는 startAt 스킵).
export function generateTimeSlots(storeId: string, body: GenerateTimeSlotsRequest) {
    return apiFetch<GenerateTimeSlotsResult>(`${BASE}/stores/${storeId}/time-slots/generate`, {
        method: 'POST',
        body,
    });
}
