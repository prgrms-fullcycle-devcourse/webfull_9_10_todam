import type { ProgramDeliveryOption } from '@todam/shared';

// 운영 정보 수정 폼 상태
export interface ProgramOperationsFormState {
    price: number;
    capacity: number;
    leadTimeDays: number;
    durationMinutes: number;
    deliveryOption: ProgramDeliveryOption;
    childrenAllowed: boolean;
    deliveryAvailable: boolean;
}

export interface PendingImage {
    /** 로컬 File 객체 */
    file: File;
    /** 미리보기용 objectURL */
    previewUrl: string;
    /** isThumbnail 여부 */
    isThumbnail: boolean;
    /** 업로드 완료 후 채워지는 서버 imageId */
    programImageId?: string;
    /** 업로드 완료 후 채워지는 CDN URL */
    imageUrl?: string;
}

// 소요시간 선택지 (30분 단위)
export const DURATION_OPTIONS: { label: string; value: number }[] = [
    { label: '30분', value: 30 },
    { label: '1시간', value: 60 },
    { label: '1시간 30분', value: 90 },
    { label: '2시간', value: 120 },
    { label: '2시간 30분', value: 150 },
    { label: '3시간', value: 180 },
    { label: '4시간', value: 240 },
];
