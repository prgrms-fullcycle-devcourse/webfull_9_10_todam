export const MAX_PROGRAM_IMAGES = 5;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

// 허용 타입·크기 통과 파일만 반환.
export function filterValidImageFiles(files: File[]): File[] {
    return files.filter(
        (f) => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE_BYTES,
    );
}
