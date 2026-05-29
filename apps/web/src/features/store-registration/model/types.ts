// 온보딩 4단계.
export enum StoreRegistrationStep {
    Business = 0, // 사업자 정보
    StoreInfo = 1, // 공방 정보
    Operating = 2, // 영업 정보
    Reservation = 3, // 예약 정보
}

export const STEP_TITLES: Record<StoreRegistrationStep, string> = {
    [StoreRegistrationStep.Business]: '사업자 정보',
    [StoreRegistrationStep.StoreInfo]: '공방 정보',
    [StoreRegistrationStep.Operating]: '영업 정보',
    [StoreRegistrationStep.Reservation]: '예약 정보',
};

export const TOTAL_STEPS = 4;
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

export interface StoreRegistrationForm {
    // 사업자 정보 (OCR·진위검증 추후 연동 → 현재 수기 입력)
    // 사업장 주소 = 주소검색 API. store 주소/좌표의 소스이기도 함.
    business: {
        documentUrl: string | null;
        businessNumber: string;
        businessName: string;
        ownerName: string;
        email: string;
        businessAddress: string; // 도로명/지번 (주소검색 결과)
        addressDetail: string; // 상세주소 (주소 선택 후 입력)
        latitude: number | null;
        longitude: number | null;
    };
    store: {
        images: string[]; // 대표 이미지 (최대 5, presigned 후행 → mock url)
        name: string;
        slug: string;
        phone: string;
        description: string;
        convenienceInfo: ConvenienceState;
        slugChecked: boolean;
        slugAvailable: boolean;
    };
    operating: OperatingState;
    reservation: {
        intervalMinutes: number; // 예약 시간 간격
        cancelDeadlineDays: number; // 예약 취소 가능 기한 (체험 N일 전)
        maxCapacity: number; // 시간대별 최대 정원
        autoConfirm: boolean | null; // null = 미선택
    };
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
