import { HttpStatus } from '@nestjs/common';
import { BUSINESS_DOCUMENT_FILE_TYPES } from '@todam/shared';
import { keyFromImageUrl } from './s3-object.util';
import { BusinessException } from '../exceptions/business.exception';
import type { S3Service } from './s3.service';

export const BUSINESS_DOCUMENT_PREFIX = 'business-documents/';

// 허용 이미지 타입(JPEG/PNG)은 업로드 계약과 동일한 SSOT를 쓴다(@todam/shared).
// 업로드 fileType enum과 저장·OCR Content-Type 검증이 한 배열을 공유 → 불일치 방지.

/**
 * documentUrl → S3 key 변환 + prefix 화이트리스트 + 소유권(IDOR) 검증.
 *
 * - key가 http(s):// 로 남아있거나 `business-documents/` prefix가 아니면 400(외부/타 리소스).
 * - key가 `business-documents/{userId}/` 로 시작하지 않으면 403(타인 서류).
 *
 * @returns 검증을 통과한 S3 object key
 */
export function resolveOwnedBusinessDocumentKey(userId: string, documentUrl: string): string {
    const key = keyFromImageUrl(documentUrl);

    if (
        key.startsWith('http://') ||
        key.startsWith('https://') ||
        !key.startsWith(BUSINESS_DOCUMENT_PREFIX)
    ) {
        throw new BusinessException(
            'INVALID_DOCUMENT_URL',
            '허용되지 않은 사업자등록증 URL입니다.',
            HttpStatus.BAD_REQUEST,
        );
    }

    if (!key.startsWith(`${BUSINESS_DOCUMENT_PREFIX}${userId}/`)) {
        throw new BusinessException(
            'FORBIDDEN',
            '본인의 사업자등록증만 사용할 수 있습니다.',
            HttpStatus.FORBIDDEN,
        );
    }

    return key;
}

/**
 * 사업자등록증을 DB에 저장하기 전 검증: 소유권(IDOR) + 실제 업로드 여부 + 이미지(JPEG/PNG) 타입.
 * 공방 생성(POST /stores)·사업자정보 수정(PATCH) 양쪽에서 동일하게 적용한다.
 *
 * @returns 검증을 통과한 S3 object key
 */
export async function assertOwnedBusinessDocumentImage(
    s3: Pick<S3Service, 'headObject'>,
    userId: string,
    documentUrl: string,
): Promise<string> {
    const key = resolveOwnedBusinessDocumentKey(userId, documentUrl);

    const head = await s3.headObject(key);
    if (!head) {
        throw new BusinessException(
            'BAD_REQUEST',
            '사업자등록증 파일이 업로드되지 않았습니다.',
            HttpStatus.BAD_REQUEST,
        );
    }

    assertBusinessDocumentContentType(head.contentType);

    return key;
}

/**
 * Content-Type 화이트리스트 검증. 허용 목록(JPEG/PNG)에 없거나, Content-Type이 없는(undefined)
 * 객체는 모두 415로 거절한다(화이트리스트 = 명시적으로 허용된 것만 통과).
 * 저장(create/update)·OCR 처리 양쪽에서 동일 규칙을 적용한다.
 */
export function assertBusinessDocumentContentType(contentType: string | undefined): void {
    if (
        contentType === undefined ||
        !(BUSINESS_DOCUMENT_FILE_TYPES as readonly string[]).includes(contentType)
    ) {
        throw new BusinessException(
            'UNSUPPORTED_DOCUMENT_TYPE',
            '사업자등록증은 JPEG/PNG 이미지만 등록할 수 있습니다.',
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
    }
}
