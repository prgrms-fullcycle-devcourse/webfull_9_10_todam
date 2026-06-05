import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from '@todam/shared';

type FilterOptions = {
    allowedTypes?: readonly string[];
    maxSizeBytes?: number;
};

// 브라우저 File[] → 허용 타입·크기 통과 파일만. 제약 값 SSOT 는 @todam/shared.
export function filterValidImageFiles(files: File[], opts?: FilterOptions): File[] {
    const allowed = opts?.allowedTypes ?? ALLOWED_IMAGE_TYPES;
    const maxSize = opts?.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
    return files.filter((f) => allowed.includes(f.type) && f.size <= maxSize);
}
