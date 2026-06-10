/// <reference types="jest" />
import {
    resolveOwnedBusinessDocumentKey,
    assertOwnedBusinessDocumentImage,
    assertBusinessDocumentContentType,
} from './business-document.util';
import { BusinessException } from '../exceptions/business.exception';
import { CDN_BASE } from './s3-object.util';
import type { S3Service } from './s3.service';

const userId = 'user-123';
const ownKey = `business-documents/${userId}/doc.jpg`;
const ownUrl = `${CDN_BASE}/${ownKey}`;

const expectBusinessException = (fn: () => unknown, errorCode: string, status: number) => {
    let caught: unknown;
    try {
        fn();
    } catch (e) {
        caught = e;
    }
    expect(caught).toBeInstanceOf(BusinessException);
    expect((caught as BusinessException).errorCode).toBe(errorCode);
    expect((caught as BusinessException).getStatus()).toBe(status);
};

const expectAsyncBusinessException = async (
    promise: Promise<unknown>,
    errorCode: string,
    status: number,
) => {
    const error = await promise.then(
        () => {
            throw new Error('예외가 발생해야 하는데 정상 반환됨');
        },
        (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(BusinessException);
    expect((error as BusinessException).errorCode).toBe(errorCode);
    expect((error as BusinessException).getStatus()).toBe(status);
};

describe('resolveOwnedBusinessDocumentKey', () => {
    it('본인 소유 URL은 key를 반환한다', () => {
        expect(resolveOwnedBusinessDocumentKey(userId, ownUrl)).toBe(ownKey);
    });

    it('CDN/S3 도메인이 아닌 외부 URL → 400 INVALID_DOCUMENT_URL', () => {
        expectBusinessException(
            () =>
                resolveOwnedBusinessDocumentKey(
                    userId,
                    'https://evil.example.com/business-documents/user-123/doc.jpg',
                ),
            'INVALID_DOCUMENT_URL',
            400,
        );
    });

    it('business-documents 외 prefix → 400 INVALID_DOCUMENT_URL', () => {
        expectBusinessException(
            () => resolveOwnedBusinessDocumentKey(userId, `${CDN_BASE}/stores/some-store/01.jpg`),
            'INVALID_DOCUMENT_URL',
            400,
        );
    });

    it('타 사용자 prefix(IDOR) → 403 FORBIDDEN', () => {
        expectBusinessException(
            () =>
                resolveOwnedBusinessDocumentKey(
                    userId,
                    `${CDN_BASE}/business-documents/other-user/doc.jpg`,
                ),
            'FORBIDDEN',
            403,
        );
    });
});

describe('assertBusinessDocumentContentType', () => {
    it.each(['image/jpeg', 'image/png'])('허용 타입 "%s"는 통과한다', (t) => {
        expect(() => assertBusinessDocumentContentType(t)).not.toThrow();
    });

    it.each(['application/pdf', 'application/octet-stream', 'image/heic', 'image/webp'])(
        '비허용 타입 "%s"는 415',
        (t) => {
            expectBusinessException(
                () => assertBusinessDocumentContentType(t),
                'UNSUPPORTED_DOCUMENT_TYPE',
                415,
            );
        },
    );

    it('Content-Type 없음(undefined)도 415로 거절한다(화이트리스트)', () => {
        expectBusinessException(
            () => assertBusinessDocumentContentType(undefined),
            'UNSUPPORTED_DOCUMENT_TYPE',
            415,
        );
    });
});

describe('assertOwnedBusinessDocumentImage', () => {
    const makeS3 = (
        head: {
            contentLength: number;
            contentType: string | undefined;
            etag: string | undefined;
        } | null,
    ) =>
        ({ headObject: jest.fn().mockResolvedValue(head) }) as unknown as Pick<
            S3Service,
            'headObject'
        >;

    it('소유권 통과 + JPEG → key 반환', async () => {
        const s3 = makeS3({ contentLength: 1000, contentType: 'image/jpeg', etag: '"e"' });
        await expect(assertOwnedBusinessDocumentImage(s3, userId, ownUrl)).resolves.toBe(ownKey);
    });

    it('타 사용자 URL → 403 (headObject 호출 전)', async () => {
        const s3 = makeS3(null);
        await expectAsyncBusinessException(
            assertOwnedBusinessDocumentImage(
                s3,
                userId,
                `${CDN_BASE}/business-documents/other/doc.jpg`,
            ),
            'FORBIDDEN',
            403,
        );
        expect(s3.headObject).not.toHaveBeenCalled();
    });

    it('객체 미존재 → 400 BAD_REQUEST', async () => {
        const s3 = makeS3(null);
        await expectAsyncBusinessException(
            assertOwnedBusinessDocumentImage(s3, userId, ownUrl),
            'BAD_REQUEST',
            400,
        );
    });

    it('허용되지 않은 Content-Type → 415', async () => {
        const s3 = makeS3({
            contentLength: 1000,
            contentType: 'application/octet-stream',
            etag: '"e"',
        });
        await expectAsyncBusinessException(
            assertOwnedBusinessDocumentImage(s3, userId, ownUrl),
            'UNSUPPORTED_DOCUMENT_TYPE',
            415,
        );
    });

    it('Content-Type 없음 → 415', async () => {
        const s3 = makeS3({ contentLength: 1000, contentType: undefined, etag: '"e"' });
        await expectAsyncBusinessException(
            assertOwnedBusinessDocumentImage(s3, userId, ownUrl),
            'UNSUPPORTED_DOCUMENT_TYPE',
            415,
        );
    });
});
