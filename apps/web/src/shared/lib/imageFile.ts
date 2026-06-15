import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from '@todam/shared';

type FilterOptions = {
    allowedTypes?: readonly string[];
    maxSizeBytes?: number;
};

export type FileValidationIssues = {
    oversized: boolean;
    unsupported: boolean;
};

export function getFileValidationIssues(files: File[], opts?: FilterOptions): FileValidationIssues {
    const allowed = opts?.allowedTypes ?? ALLOWED_IMAGE_TYPES;
    const maxSize = opts?.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
    return {
        oversized: files.some((file) => file.size > maxSize),
        unsupported: files.some((file) => !allowed.includes(file.type)),
    };
}

// 브라우저 File[] → 허용 타입·크기 통과 파일만. 제약 값 SSOT 는 @todam/shared.
export function filterValidImageFiles(files: File[], opts?: FilterOptions): File[] {
    const allowed = opts?.allowedTypes ?? ALLOWED_IMAGE_TYPES;
    const maxSize = opts?.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
    return files.filter((f) => allowed.includes(f.type) && f.size <= maxSize);
}
