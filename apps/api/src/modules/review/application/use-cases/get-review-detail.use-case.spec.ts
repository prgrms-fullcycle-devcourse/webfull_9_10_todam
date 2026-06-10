/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { ReviewActionsErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { GetReviewDetailUseCase } from './get-review-detail.use-case';

describe('GetReviewDetailUseCase', () => {
    const findReservationForReview = jest.fn();
    const existsReviewByReservation = jest.fn();
    const createReviewWithPhotos = jest.fn();
    const findReviewWithPhotos = jest.fn();
    const updateReviewWithPhotos = jest.fn();
    const findReviewByReservationWithPhotos = jest.fn();
    const findReviewByIdWithPhotos = jest.fn();
    const deleteReviewCascade = jest.fn();

    const repo = {
        findReservationForReview,
        existsReviewByReservation,
        createReviewWithPhotos,
        findReviewWithPhotos,
        updateReviewWithPhotos,
        findReviewByReservationWithPhotos,
        findReviewByIdWithPhotos,
        deleteReviewCascade,
    };

    const useCase = new GetReviewDetailUseCase(repo as never);

    const USER_ID = 'user-001';
    const RESERVATION_ID = 'res-001';
    const REVIEW_ID = 'review-001';

    const validReservation = {
        userId: USER_ID,
        storeId: 'store-001',
        scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: ReservationStatus.IN_PROGRESS,
    };

    const reviewWithPhotos = {
        id: REVIEW_ID,
        reservationId: RESERVATION_ID,
        userId: USER_ID,
        rating: 5,
        content: '정말 즐거운 체험이었어요.',
        photos: [
            { id: 'p1', imageUrl: 'https://cdn.todam.app/reviews/001.jpg', sortOrder: 0 },
            { id: 'p2', imageUrl: 'https://cdn.todam.app/reviews/002.jpg', sortOrder: 1 },
        ],
        createdAt: new Date('2026-05-25T19:35:00.000Z'),
        updatedAt: new Date('2026-05-25T19:35:00.000Z'),
    };

    const reviewWithNullContent = {
        ...reviewWithPhotos,
        content: null,
    };

    beforeEach(() => {
        findReservationForReview.mockReset();
        findReviewByReservationWithPhotos.mockReset();
    });

    it('정상 조회 성공 — photos sortOrder ASC 반환', async () => {
        findReservationForReview.mockResolvedValue(validReservation);
        findReviewByReservationWithPhotos.mockResolvedValue(reviewWithPhotos);

        const result = await useCase.execute(USER_ID, RESERVATION_ID);

        expect(result.id).toBe(REVIEW_ID);
        expect(result.reservationId).toBe(RESERVATION_ID);
        expect(result.rating).toBe(5);
        expect(result.content).toBe('정말 즐거운 체험이었어요.');
        expect(result.photos).toHaveLength(2);
        expect(result.photos[0]?.sortOrder).toBe(0);
        expect(result.photos[1]?.sortOrder).toBe(1);
        expect(findReviewByReservationWithPhotos).toHaveBeenCalledWith(RESERVATION_ID);
    });

    it('content null → null 그대로 반환 (컨트롤러에서 ?? "" 처리)', async () => {
        findReservationForReview.mockResolvedValue(validReservation);
        findReviewByReservationWithPhotos.mockResolvedValue(reviewWithNullContent);

        const result = await useCase.execute(USER_ID, RESERVATION_ID);

        expect(result.content).toBeNull();
    });

    it('photos 빈 배열 허용', async () => {
        findReservationForReview.mockResolvedValue(validReservation);
        findReviewByReservationWithPhotos.mockResolvedValue({ ...reviewWithPhotos, photos: [] });

        const result = await useCase.execute(USER_ID, RESERVATION_ID);

        expect(result.photos).toHaveLength(0);
    });

    it('예약 없음 → 403 FORBIDDEN', async () => {
        findReservationForReview.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, RESERVATION_ID)).rejects.toMatchObject({
            errorCode: ReviewActionsErrorCode.FORBIDDEN,
            status: HttpStatus.FORBIDDEN,
        });
    });

    it('타인 예약 → 403 FORBIDDEN', async () => {
        findReservationForReview.mockResolvedValue({
            ...validReservation,
            userId: 'other-user',
        });

        await expect(useCase.execute(USER_ID, RESERVATION_ID)).rejects.toMatchObject({
            errorCode: ReviewActionsErrorCode.FORBIDDEN,
            status: HttpStatus.FORBIDDEN,
        });
    });

    it('예약은 있으나 리뷰 없음 → 404 REVIEW_NOT_FOUND', async () => {
        findReservationForReview.mockResolvedValue(validReservation);
        findReviewByReservationWithPhotos.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, RESERVATION_ID)).rejects.toMatchObject({
            errorCode: ReviewActionsErrorCode.REVIEW_NOT_FOUND,
            status: HttpStatus.NOT_FOUND,
        });
    });

    it('BusinessException 인스턴스임을 확인', async () => {
        findReservationForReview.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, RESERVATION_ID)).rejects.toBeInstanceOf(
            BusinessException,
        );
    });
});
