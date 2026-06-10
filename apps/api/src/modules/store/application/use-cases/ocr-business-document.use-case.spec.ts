/// <reference types="jest" />

// @todam/config 는 src(TS/ESM)로 해석되어 jest transform 대상 밖이므로, use-case import 전에 모킹.
// (transitive: use-case → S3Service → @todam/config)
jest.mock('@todam/config', () => ({
    createApiEnv: () => ({
        S3_REGION: 'ap-northeast-2',
        S3_BUCKET_NAME: 'test-bucket',
    }),
}));

import { ServiceUnavailableException } from '@nestjs/common';
import { OcrBusinessDocumentUseCase } from './ocr-business-document.use-case';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CDN_BASE } from '../../../../common/s3/s3-object.util';
import { ObjectTooLargeError } from '../../../../common/s3/s3.service';
import type { S3Service } from '../../../../common/s3/s3.service';
import type { VisionService } from '../../../../common/vision/vision.service';

describe('OcrBusinessDocumentUseCase', () => {
    const userId = 'user-123';
    const ownKey = `business-documents/${userId}/doc.jpg`;
    const ownUrl = `${CDN_BASE}/${ownKey}`;
    const TEST_ETAG = '"etag-abc123"';

    let s3: jest.Mocked<Pick<S3Service, 'headObject' | 'getObjectBuffer'>>;
    let vision: jest.Mocked<Pick<VisionService, 'detectText'>>;
    let redis: { get: jest.Mock; set: jest.Mock };
    let useCase: OcrBusinessDocumentUseCase;

    beforeEach(() => {
        s3 = {
            headObject: jest.fn(),
            getObjectBuffer: jest.fn(),
        };
        vision = {
            detectText: jest.fn(),
        };
        // 기본: 캐시 미스(get→null), set은 성공.
        redis = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
        };
        useCase = new OcrBusinessDocumentUseCase(
            s3 as unknown as S3Service,
            vision as unknown as VisionService,
            redis as never,
        );
    });

    const expectBusinessException = async (
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

    it('prefix 화이트리스트 불일치(다른 리소스) → 400 INVALID_DOCUMENT_URL', async () => {
        const url = `${CDN_BASE}/stores/some-store/01.jpg`;
        await expectBusinessException(useCase.execute(userId, url), 'INVALID_DOCUMENT_URL', 400);
        expect(s3.headObject).not.toHaveBeenCalled();
    });

    it('CDN/S3 도메인이 아닌 외부 URL → 400 INVALID_DOCUMENT_URL', async () => {
        const url = 'https://evil.example.com/business-documents/user-123/doc.jpg';
        await expectBusinessException(useCase.execute(userId, url), 'INVALID_DOCUMENT_URL', 400);
        expect(s3.headObject).not.toHaveBeenCalled();
    });

    it('타 userId prefix(IDOR) → 403 FORBIDDEN', async () => {
        const url = `${CDN_BASE}/business-documents/other-user/doc.jpg`;
        await expectBusinessException(useCase.execute(userId, url), 'FORBIDDEN', 403);
        expect(s3.headObject).not.toHaveBeenCalled();
    });

    it('객체 미존재(HeadObject null) → 404 DOCUMENT_NOT_FOUND', async () => {
        s3.headObject.mockResolvedValue(null);
        await expectBusinessException(useCase.execute(userId, ownUrl), 'DOCUMENT_NOT_FOUND', 404);
        expect(s3.getObjectBuffer).not.toHaveBeenCalled();
    });

    it('PDF(Content-Type) → 415 UNSUPPORTED_DOCUMENT_TYPE, 다운로드하지 않는다', async () => {
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'application/pdf',
            etag: TEST_ETAG,
        });
        await expectBusinessException(
            useCase.execute(userId, ownUrl),
            'UNSUPPORTED_DOCUMENT_TYPE',
            415,
        );
        expect(s3.getObjectBuffer).not.toHaveBeenCalled();
        expect(vision.detectText).not.toHaveBeenCalled();
    });

    it('10MB 초과 → 413 DOCUMENT_TOO_LARGE, 다운로드하지 않는다', async () => {
        s3.headObject.mockResolvedValue({
            contentLength: 10 * 1024 * 1024 + 1,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        await expectBusinessException(useCase.execute(userId, ownUrl), 'DOCUMENT_TOO_LARGE', 413);
        expect(s3.getObjectBuffer).not.toHaveBeenCalled();
    });

    it('다운로드 스트리밍 중 상한 초과(TOCTOU 교체) → 413 DOCUMENT_TOO_LARGE', async () => {
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        // HeadObject는 작게 보고했지만 실제 스트리밍에서 상한 초과(객체 교체 시나리오).
        s3.getObjectBuffer.mockRejectedValue(new ObjectTooLargeError('too large'));

        await expectBusinessException(useCase.execute(userId, ownUrl), 'DOCUMENT_TOO_LARGE', 413);
        expect(vision.detectText).not.toHaveBeenCalled();
    });

    it('Vision 자격증명 미설정(503)은 500으로 덮지 않고 그대로 전달한다', async () => {
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        s3.getObjectBuffer.mockResolvedValue(Buffer.from('img'));
        vision.detectText.mockRejectedValue(new ServiceUnavailableException('no creds'));

        await expect(useCase.execute(userId, ownUrl)).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
    });

    it('Vision 일반 장애 → 500 OCR_FAILED', async () => {
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        s3.getObjectBuffer.mockResolvedValue(Buffer.from('img'));
        vision.detectText.mockRejectedValue(new Error('vision down'));

        await expectBusinessException(useCase.execute(userId, ownUrl), 'OCR_FAILED', 500);
    });

    it('성공 → 파싱된 필드를 반환', async () => {
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        s3.getObjectBuffer.mockResolvedValue(Buffer.from('img'));
        vision.detectText.mockResolvedValue(
            '등록번호: 123-45-67890\n상호(단체명) 흙담공방\n성명(대표자) 홍길동\n개업연월일 2019.03.15\n사업장소재지 서울특별시 성동구 둑섬로 273',
        );

        const result = await useCase.execute(userId, ownUrl);
        expect(result).toEqual({
            businessNumber: '123-45-67890',
            ownerName: '홍길동',
            businessName: '흙담공방',
            businessAddress: '서울특별시 성동구 둑섬로 273',
            startDate: '20190315',
        });
        // 결과를 캐시에 저장한다(키에 ETag 포함).
        expect(redis.set).toHaveBeenCalledWith(
            `ocr:result:${ownKey}:${TEST_ETAG}`,
            expect.any(String),
            expect.any(Number),
        );
    });

    it('캐시 적중 시 GetObject·Vision 없이 캐시 결과를 반환한다(HeadObject로 존재·ETag는 확인)', async () => {
        const cachedResult = {
            businessNumber: '999-99-99999',
            ownerName: '캐시',
            businessName: '캐시공방',
            businessAddress: '서울',
            startDate: '20200101',
        };
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        redis.get.mockResolvedValue(JSON.stringify(cachedResult));

        const result = await useCase.execute(userId, ownUrl);
        expect(result).toEqual(cachedResult);
        // 캐시는 ETag 키로 조회한다 → 삭제·교체 시 이전 결과 미반환.
        expect(redis.get).toHaveBeenCalledWith(`ocr:result:${ownKey}:${TEST_ETAG}`);
        // 무거운 다운로드·Vision은 건너뛴다.
        expect(s3.getObjectBuffer).not.toHaveBeenCalled();
        expect(vision.detectText).not.toHaveBeenCalled();
    });

    it('Redis 장애는 무시하고 OCR을 정상 수행한다(best-effort)', async () => {
        redis.get.mockRejectedValue(new Error('redis down'));
        redis.set.mockRejectedValue(new Error('redis down'));
        s3.headObject.mockResolvedValue({
            contentLength: 1000,
            contentType: 'image/jpeg',
            etag: TEST_ETAG,
        });
        s3.getObjectBuffer.mockResolvedValue(Buffer.from('img'));
        vision.detectText.mockResolvedValue('등록번호: 123-45-67890');

        const result = await useCase.execute(userId, ownUrl);
        expect(result.businessNumber).toBe('123-45-67890');
    });
});
