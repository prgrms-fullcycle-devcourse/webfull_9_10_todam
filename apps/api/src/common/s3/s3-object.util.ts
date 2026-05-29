import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../constants/error-code';

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
