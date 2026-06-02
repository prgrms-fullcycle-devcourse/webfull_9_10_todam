export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const MAX_ARTWORK_PHOTO_COUNT = 5;

export const MAX_REVIEW_PHOTO_COUNT = 3;

// 스토어·프로그램·작품·리뷰 이미지 공통 허용 타입
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const;

export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
