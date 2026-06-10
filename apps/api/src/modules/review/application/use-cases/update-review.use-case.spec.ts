/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ReviewWriteErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UpdateReviewUseCase } from './update-review.use-case';

const EDIT_DEADLINE_MS = 30 * 24 * 60 * 60 * 1000;

describe('UpdateReviewUseCase', () => {
    const findReservationForReview = jest.fn();
    const existsReviewByReservation = jest.fn();
    const createReviewWithPhotos = jest.fn();
    const findReviewWithPhotos = jest.fn();
    const updateReviewWithPhotos = jest.fn();

    const repo = {
        findReservationForReview,
        existsReviewByReservation,
        createReviewWithPhotos,
        findReviewWithPhotos,
        updateReviewWithPhotos,
    };

    const useCase = new UpdateReviewUseCase(repo as never);

    const USER_ID = 'user-001';
    const REVIEW_ID = 'review-001';

    const validReview = {
        id: REVIEW_ID,
        reservationId: 'res-001',
        userId: USER_ID,
        rating: 5,
        content: '원래 내용',
        photos: [
            { id: 'p1', imageUrl: 'https://cdn.todam.app/reviews/photos/old.jpg', sortOrder: 0 },
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5일 전
        updatedAt: new Date(),
    };

    const validDto = { rating: 4, content: '수정된 내용', photos: [] };

    const updatedReview = {
        ...validReview,
        rating: 4,
        content: '수정된 내용',
        photos: [],
        updatedAt: new Date(),
    };

    beforeEach(() => {
        findReviewWithPhotos.mockReset();
        updateReviewWithPhotos.mockReset();
    });

    it('정상 수정 성공 — photos 재생성', async () => {
        findReviewWithPhotos.mockResolvedValue(validReview);
        updateReviewWithPhotos.mockResolvedValue(updatedReview);

        const result = await useCase.execute(USER_ID, REVIEW_ID, validDto);

        expect(result.rating).toBe(4);
        expect(updateReviewWithPhotos).toHaveBeenCalledWith(
            REVIEW_ID,
            expect.objectContaining({ rating: 4, content: '수정된 내용', photos: [] }),
        );
    });

    it('photos 재생성 — 기존 삭제 후 신규 key + 유지 URL 통합', async () => {
        const dto = {
            rating: 3,
            photos: ['reviews/photos/new-key.jpg', 'https://cdn.todam.app/reviews/photos/keep.jpg'],
        };
        findReviewWithPhotos.mockResolvedValue(validReview);
        updateReviewWithPhotos.mockResolvedValue({ ...updatedReview, photos: [] });

        await useCase.execute(USER_ID, REVIEW_ID, dto);

        const arg = updateReviewWithPhotos.mock.calls[0]?.[1] as {
            photos: { imageUrl: string; sortOrder: number }[];
        };
        expect(arg.photos[0]?.imageUrl).toBe('https://cdn.todam.app/reviews/photos/new-key.jpg');
        expect(arg.photos[1]?.imageUrl).toBe('https://cdn.todam.app/reviews/photos/keep.jpg');
        expect(arg.photos[0]?.sortOrder).toBe(0);
        expect(arg.photos[1]?.sortOrder).toBe(1);
    });

    it('리뷰 없음 → 404 REVIEW_NOT_FOUND', async () => {
        findReviewWithPhotos.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, REVIEW_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.REVIEW_NOT_FOUND,
            status: HttpStatus.NOT_FOUND,
        });
    });

    it('타인 리뷰 → 403 FORBIDDEN', async () => {
        findReviewWithPhotos.mockResolvedValue({ ...validReview, userId: 'other-user' });

        await expect(useCase.execute(USER_ID, REVIEW_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.FORBIDDEN,
            status: HttpStatus.FORBIDDEN,
        });
    });

    it('createdAt + 30일 초과 → 400 REVIEW_EDIT_DEADLINE_EXCEEDED', async () => {
        const oldCreatedAt = new Date(Date.now() - EDIT_DEADLINE_MS - 1000);
        findReviewWithPhotos.mockResolvedValue({ ...validReview, createdAt: oldCreatedAt });

        await expect(useCase.execute(USER_ID, REVIEW_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.REVIEW_EDIT_DEADLINE_EXCEEDED,
            status: HttpStatus.BAD_REQUEST,
        });
    });

    it('createdAt + 30일 경계(딱 초과) → REVIEW_EDIT_DEADLINE_EXCEEDED', async () => {
        const boundaryCreatedAt = new Date(Date.now() - EDIT_DEADLINE_MS - 1);
        findReviewWithPhotos.mockResolvedValue({ ...validReview, createdAt: boundaryCreatedAt });

        await expect(useCase.execute(USER_ID, REVIEW_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.REVIEW_EDIT_DEADLINE_EXCEEDED,
        });
    });

    it('BusinessException 인스턴스임을 확인', async () => {
        findReviewWithPhotos.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, REVIEW_ID, validDto)).rejects.toBeInstanceOf(
            BusinessException,
        );
    });
});
