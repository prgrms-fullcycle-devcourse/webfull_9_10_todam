import type { PartnerStoreDetail } from '@todam/shared';

import { MAX_STORE_IMAGES, type OperatingState, type ConvenienceState } from '@/entities/store';

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
export interface StoreEditForm {
    storeId: string;
    store: {
        images: EditImage[];
        name: string;
        slug: string;
        phone: string;
        description: string;
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
export function detailToForm(detail: PartnerStoreDetail): StoreEditForm {
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
            phone: detail.phone,
            description: detail.description ?? '',
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
