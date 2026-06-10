/// <reference types="jest" />

// @todam/config 는 ESM 빌드이므로 jest transform 전 모킹
jest.mock('@todam/config', () => ({
    createApiEnv: () => ({
        S3_REGION: 'ap-northeast-2',
        S3_BUCKET_NAME: 'test-bucket',
        CDN_BASE_URL: 'https://cdn.todam.app',
    }),
}));

// buildObjectKey 는 INVALID_REQUEST 를 던질 수 있는 순수 함수를 포함하므로 모킹
jest.mock('../../../../common/s3/s3-object.util', () => ({
    buildObjectKey: jest.fn((prefix: string, _type: string, name: string) => `${prefix}/${name}`),
    CDN_BASE: 'https://cdn.todam.app',
}));

import { IssueReviewImagePresignedUseCase } from './issue-review-image-presigned.use-case';

describe('IssueReviewImagePresignedUseCase', () => {
    const createPresignedPutUrl = jest.fn();
    const s3 = { createPresignedPutUrl };

    const useCase = new IssueReviewImagePresignedUseCase(s3 as never);

    beforeEach(() => {
        createPresignedPutUrl.mockReset();
    });

    it('key 와 uploadUrl 을 반환한다', async () => {
        createPresignedPutUrl.mockResolvedValue({ uploadUrl: 'https://s3.presigned.url', key: '' });

        const result = await useCase.execute({
            fileName: 'review.jpg',
            fileType: 'image/jpeg',
        });

        expect(result.uploadUrl).toBe('https://s3.presigned.url');
        expect(result.key).toBe('reviews/photos/review.jpg');
    });

    it('createPresignedPutUrl 을 TTL=300 으로 호출한다', async () => {
        createPresignedPutUrl.mockResolvedValue({ uploadUrl: 'https://s3.presigned.url', key: '' });

        await useCase.execute({ fileName: 'photo.png', fileType: 'image/png' });

        expect(createPresignedPutUrl).toHaveBeenCalledWith(
            'reviews/photos/photo.png',
            'image/png',
            300,
        );
    });
});
