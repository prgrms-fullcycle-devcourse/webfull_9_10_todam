import type { ProgramDeliveryOption, ProgramDifficulty, ProgramImage } from '@todam/shared';

// 기본 정보 수정 폼 상태
export interface ProgramInfoFormState {
    title: string;
    description: string;
    difficulty: ProgramDifficulty;
    // 기존 이미지 목록 (서버에서 로드)
    existingImages: ProgramImage[];
    // 신규 업로드 대기 파일
    pendingImages: PendingImage[];
    // 삭제 예정 imageId 목록
    deletedImageIds: string[];
}

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

export const MAX_PROGRAM_IMAGES = 5;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
