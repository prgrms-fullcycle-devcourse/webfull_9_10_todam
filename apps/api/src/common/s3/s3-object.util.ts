import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../constants/error-code';

// S3 버킷 공개 읽기(prefix: stores/* programs/* reviews/*) 직접 주소.
// 추후 cdn.todam.app CDN 구축 시 이 상수만 교체하면 됨.
export const CDN_BASE = 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com';

export function keyFromImageUrl(imageUrl: string): string {
    return imageUrl.startsWith(`${CDN_BASE}/`) ? imageUrl.slice(CDN_BASE.length + 1) : imageUrl;
}

const ALLOWED_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
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
