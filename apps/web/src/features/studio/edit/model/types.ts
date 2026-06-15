import type { PartnerStoreDetail } from '@todam/shared';

import { MAX_STORE_IMAGES, type OperatingState, type ConvenienceState } from '@/entities/studio';

// 공유 상수/타입은 store/shared/model 단일 소스에서 re-export (외부 import 경로 호환).
export { MAX_STORE_IMAGES, type OperatingState, type ConvenienceState };

// 수정 화면 3종.
export type EditSection = 'info' | 'operating' | 'reservation';

// 이미지 항목 — 수정 화면 로컬 상태. GET 응답 + presigned 추가분.
export interface EditImage {
    id: string; // 이미지 id (PATCH images[] 로 전송)
    imageUrl: string;
    isThumbnail: boolean;
}

// 수정 폼 전체. GET preload 로 채운다.
export interface StudioEditForm {
    storeId: string;
    store: {
        images: EditImage[];
        name: string;
        slug: string;
        phone: string;
        description: string;
        // 주소·좌표·행정구역 — 주소 변경 시 Kakao geocode로 재계산. GET 응답엔 region 없어 preload는 null.
        // address = 도로명/지번, addressDetail = 상세주소. 저장 시 합쳐 단일 address로 전송(등록과 동일).
        address: string;
        addressDetail: string;
        latitude: number | null;
        longitude: number | null;
        regionSido: string | null;
        regionSigungu: string | null;
        regionDong: string | null;
        convenienceInfo: ConvenienceState;
    };
    operating: OperatingState;
    reservation: {
        intervalMinutes: number;
        cancelDeadlineDays: number;
        maxCapacity: number;
        autoConfirm: boolean;
    };
}

// DAY_OF_WEEK index ↔ businessDays(0=일~6=토) 매핑
const DOW_ORDER = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

// GET 응답 → 수정 폼 변환 (preload).
export function detailToForm(detail: PartnerStoreDetail): StudioEditForm {
    const hours = detail.operatingHours;
    const first = hours[0];
    const businessDays = hours
        .map((h) => DOW_ORDER.indexOf(h.dayOfWeek))
        .filter((i) => i >= 0)
        .sort((a, b) => a - b);
    return {
        storeId: detail.id,
        store: {
            images: detail.images
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((img) => ({
                    id: img.id,
                    imageUrl: img.imageUrl,
                    isThumbnail: img.isThumbnail,
                })),
            name: detail.name,
            slug: detail.slug,
            phone: detail.phone ?? '',
            description: detail.description ?? '',
            address: detail.address ?? '',
            // 상세주소는 저장 시 address에 합쳐지므로 GET에서 분리 불가 → 빈 값. 주소 재선택 시 입력.
            addressDetail: '',
            latitude: detail.latitude,
            longitude: detail.longitude,
            // GET 상세에 행정구역 미포함 — 주소 재선택 시에만 채워진다.
            regionSido: null,
            regionSigungu: null,
            regionDong: null,
            convenienceInfo: { ...detail.convenienceInfo },
        },
        operating: {
            openTime: first?.openTime ?? '10:00',
            closeTime: first?.closeTime ?? '18:00',
            breakStart: first?.breakStart ?? '',
            breakEnd: first?.breakEnd ?? '',
            businessDays: businessDays.length > 0 ? businessDays : [],
        },
        reservation: {
            intervalMinutes: detail.reservationIntervalMinutes,
            cancelDeadlineDays: detail.cancelDeadlineDays,
            maxCapacity: detail.maxCapacityPerSlot,
            autoConfirm: detail.autoConfirm,
        },
    };
}
