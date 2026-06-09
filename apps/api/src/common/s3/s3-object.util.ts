import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../constants/error-code';

// Public asset URLs use Cloudflare CDN while uploads and object operations still use S3 keys.
export const CDN_BASE = 'https://cdn.todam.app';
const LEGACY_S3_BASE = 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com';

export function keyFromImageUrl(imageUrl: string): string {
    const base = [CDN_BASE, LEGACY_S3_BASE].find((candidate) =>
        imageUrl.startsWith(`${candidate}/`),
    );
    return base ? imageUrl.slice(base.length + 1) : imageUrl;
}

const ALLOWED_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
};

export function buildObjectKey(prefix: string, contentType: string, filename?: string): string {
    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
        throw new BusinessException(
            ErrorCode.INVALID_REQUEST,
            '허용되지 않은 파일 형식입니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
    const uuid = randomUUID();
    return filename ? `${prefix}/${uuid}_${filename}` : `${prefix}/${uuid}.${ext}`;
}
