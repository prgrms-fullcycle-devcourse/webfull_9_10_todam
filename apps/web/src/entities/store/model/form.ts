// 공방 등록(registration)·정보 수정(edit) 폼이 공유하는 상수/타입 단일 소스.
// 두 feature의 model/types.ts 가 여기서 re-export 한다.

export const MAX_STORE_IMAGES = 5;

// 영업 시간: 단일 오픈/마감 + 휴식(선택) + 영업일 집합.
// 제출 시 businessDays 각 요일에 동일 시간으로 operatingHours[] 확장.
export interface OperatingState {
    openTime: string; // "HH:mm"
    closeTime: string;
    breakStart: string; // "" = 휴식 없음
    breakEnd: string;
    businessDays: number[]; // 0=일 ~ 6=토
}

export interface ConvenienceState {
    parking: boolean;
    pet: boolean;
    wifi: boolean;
}

// 예약 시간 간격 옵션 (label / 분)
export const INTERVAL_OPTIONS: { label: string; value: number }[] = [
    { label: '1시간', value: 60 },
    { label: '1.5시간', value: 90 },
    { label: '2시간', value: 120 },
    { label: '3시간', value: 180 },
];

// 영업일 chip 표시 순서 (월 먼저). value = 0(일)~6(토)
export const DAY_CHIPS: { label: string; value: number }[] = [
    { label: '월', value: 1 },
    { label: '화', value: 2 },
    { label: '수', value: 3 },
    { label: '목', value: 4 },
    { label: '금', value: 5 },
    { label: '토', value: 6 },
    { label: '일', value: 0 },
];

// figma step3: 주차·반려동물만 노출 (wifi는 미노출, body엔 false 유지)
export const CONVENIENCE_OPTIONS: { key: keyof ConvenienceState; label: string }[] = [
    { key: 'parking', label: '주차' },
    { key: 'pet', label: '반려동물 동반' },
];
