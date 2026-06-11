import type { PendingImage } from '@/shared/model';
import {
    MAX_STORE_IMAGES,
    INTERVAL_OPTIONS,
    DAY_CHIPS,
    CONVENIENCE_OPTIONS,
    type OperatingState,
    type ConvenienceState,
} from '@/entities/studio';

// 공유 상수/타입은 store/shared/model 단일 소스에서 re-export (외부 import 경로 호환).
export {
    MAX_STORE_IMAGES,
    INTERVAL_OPTIONS,
    DAY_CHIPS,
    CONVENIENCE_OPTIONS,
    type OperatingState,
    type ConvenienceState,
};

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

export interface StudioRegistrationForm {
    // 사업자 정보 (사업자등록증 OCR 자동입력 + 사용자 수정).
    // businessAddress = 등록증상 사업장 소재지(수기/OCR 텍스트). 좌표·위치노출과 무관.
    business: {
        documentUrl: string | null;
        businessNumber: string;
        businessName: string;
        ownerName: string;
        email: string;
        startDate: string; // 개업일자 "YYYYMMDD" (OCR prefill + 사용자 수정)
        businessAddress: string; // 등록증상 사업장 주소 (수기 입력, 선택값)
    };
    store: {
        images: PendingImage[]; // 대표 이미지 (최대 5, File 펜딩 — 제출 시 presigned 업로드)
        name: string;
        slug: string;
        phone: string;
        description: string;
        convenienceInfo: ConvenienceState;
        slugChecked: boolean;
        slugAvailable: boolean;
        // 공방 운영 주소 = 고객 노출·위치기반 검색 소스. 주소검색 + Kakao 좌표변환.
        address: string; // 도로명/지번 (주소검색 결과)
        addressDetail: string; // 상세주소
        latitude: number | null;
        longitude: number | null;
        // 행정구역(좌표 → coord2RegionCode). 지역명 검색 소스. 변환 실패 시 null.
        regionSido: string | null;
        regionSigungu: string | null;
        regionDong: string | null;
    };
    operating: OperatingState;
    reservation: {
        intervalMinutes: number; // 예약 시간 간격
        cancelDeadlineDays: number; // 예약 취소 가능 기한 (체험 N일 전)
        maxCapacity: number; // 시간대별 최대 정원
        autoConfirm: boolean | null; // null = 미선택
    };
}
