/// <reference types="jest" />

// @todam/config 는 ESM 빌드이므로 jest transform 전 모킹
jest.mock('@todam/config', () => ({
    createApiEnv: () => ({
        S3_REGION: 'ap-northeast-2',
        S3_BUCKET_NAME: 'test-bucket',
        CDN_BASE_URL: 'https://cdn.todam.app',
    }),
}));

import { HttpStatus } from '@nestjs/common';
import { ReviewActionsErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { DeleteReviewUseCase } from './delete-review.use-case';

describe('DeleteReviewUseCase', () => {
    const findReservationForReview = jest.fn();
    const existsReviewByReservation = jest.fn();
    const createReviewWithPhotos = jest.fn();
    const findReviewWithPhotos = jest.fn();
    const updateReviewWithPhotos = jest.fn();
    const findReviewByReservationWithPhotos = jest.fn();
    const deleteReviewCascade = jest.fn();

    const repo = {
        findReservationForReview,
        existsReviewByReservation,
        createReviewWithPhotos,
        findReviewWithPhotos,
        updateReviewWithPhotos,
        findReviewByReservationWithPhotos,
        deleteReviewCascade,
    };

    const deleteImageObjects = jest.fn();
    const s3 = { deleteImageObjects };

    const useCase = new DeleteReviewUseCase(repo as never, s3 as never);

    const USER_ID = 'user-001';
    const REVIEW_ID = 'review-001';

    const reviewWithPhotos = {
        id: REVIEW_ID,
        reservationId: 'res-001',
        userId: USER_ID,
        rating: 5,
        content: '좋았어요',
        photos: [
            { id: 'p1', imageUrl: 'https://cdn.todam.app/reviews/001.jpg', sortOrder: 0 },
            { id: 'p2', imageUrl: 'https://cdn.todam.app/reviews/002.jpg', sortOrder: 1 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const reviewNoPhotos = {
        ...reviewWithPhotos,
        photos: [],
    };

    beforeEach(() => {
        findReviewWithPhotos.mockReset();
        deleteReviewCascade.mockReset();
        deleteImageObjects.mockReset();
        deleteImageObjects.mockResolvedValue(undefined);
    });

    it('정상 삭제 성공 — deleteReviewCascade 호출 후 S3 deleteImageObjects 호출', async () => {
        findReviewWithPhotos.mockResolvedValue(reviewWithPhotos);
        deleteReviewCascade.mockResolvedValue(undefined);

        await useCase.execute(USER_ID, REVIEW_ID);

        expect(deleteReviewCascade).toHaveBeenCalledWith(REVIEW_ID);
        expect(deleteImageObjects).toHaveBeenCalledWith([
            'https://cdn.todam.app/reviews/001.jpg',
            'https://cdn.todam.app/reviews/002.jpg',
        ]);
    });

    it('photos 없는 리뷰 삭제 — deleteReviewCascade 호출, S3는 빈 배열로 호출', async () => {
        findReviewWithPhotos.mockResolvedValue(reviewNoPhotos);
        deleteReviewCascade.mockResolvedValue(undefined);

        await useCase.execute(USER_ID, REVIEW_ID);

        expect(deleteReviewCascade).toHaveBeenCalledWith(REVIEW_ID);
        expect(deleteImageObjects).toHaveBeenCalledWith([]);
    });

    it('S3 삭제 실패해도 삭제 성공 처리 (비차단)', async () => {
        findReviewWithPhotos.mockResolvedValue(reviewWithPhotos);
        deleteReviewCascade.mockResolvedValue(undefined);
        deleteImageObjects.mockRejectedValue(new Error('S3 network error'));

        // S3 실패에도 예외가 전파되지 않아야 한다
        await expect(useCase.execute(USER_ID, REVIEW_ID)).resolves.toBeUndefined();
        expect(deleteReviewCascade).toHaveBeenCalledWith(REVIEW_ID);
    });

    it('리뷰 없음 → 404 REVIEW_NOT_FOUND', async () => {
        findReviewWithPhotos.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, REVIEW_ID)).rejects.toMatchObject({
            errorCode: ReviewActionsErrorCode.REVIEW_NOT_FOUND,
            status: HttpStatus.NOT_FOUND,
        });
        expect(deleteReviewCascade).not.toHaveBeenCalled();
    });

    it('타인 리뷰 → 403 FORBIDDEN', async () => {
        findReviewWithPhotos.mockResolvedValue({ ...reviewWithPhotos, userId: 'other-user' });

        await expect(useCase.execute(USER_ID, REVIEW_ID)).rejects.toMatchObject({
            errorCode: ReviewActionsErrorCode.FORBIDDEN,
            status: HttpStatus.FORBIDDEN,
        });
        expect(deleteReviewCascade).not.toHaveBeenCalled();
    });

    it('BusinessException 인스턴스임을 확인', async () => {
        findReviewWithPhotos.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, REVIEW_ID)).rejects.toBeInstanceOf(BusinessException);
    });

    it('트랜잭션 실패 시 S3 삭제 미호출', async () => {
        findReviewWithPhotos.mockResolvedValue(reviewWithPhotos);
        deleteReviewCascade.mockRejectedValue(new Error('DB error'));

        await expect(useCase.execute(USER_ID, REVIEW_ID)).rejects.toThrow('DB error');
        expect(deleteImageObjects).not.toHaveBeenCalled();
    });
});
