/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { ReviewWriteErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CreateReviewUseCase } from './create-review.use-case';

const REVIEW_DEADLINE_MS = 180 * 24 * 60 * 60 * 1000;
const EDIT_DEADLINE_MS = 30 * 24 * 60 * 60 * 1000;

describe('CreateReviewUseCase', () => {
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

    const useCase = new CreateReviewUseCase(repo as never);

    const USER_ID = 'user-001';
    const RESERVATION_ID = 'res-001';
    const STORE_ID = 'store-001';

    const validReservation = {
        userId: USER_ID,
        storeId: STORE_ID,
        scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10일 전
        status: ReservationStatus.IN_PROGRESS,
    };

    const validDto = { rating: 5, content: '좋았어요', photos: [] };

    const createdReview = {
        id: 'review-001',
        reservationId: RESERVATION_ID,
        userId: USER_ID,
        rating: 5,
        content: '좋았어요',
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        findReservationForReview.mockReset();
        existsReviewByReservation.mockReset();
        createReviewWithPhotos.mockReset();
    });

    it('정상 작성 성공 — photos 없음', async () => {
        findReservationForReview.mockResolvedValue(validReservation);
        existsReviewByReservation.mockResolvedValue(false);
        createReviewWithPhotos.mockResolvedValue(createdReview);

        const result = await useCase.execute(USER_ID, RESERVATION_ID, validDto);

        expect(result.id).toBe('review-001');
        expect(createReviewWithPhotos).toHaveBeenCalledWith(
            expect.objectContaining({
                reservationId: RESERVATION_ID,
                userId: USER_ID,
                storeId: STORE_ID,
                rating: 5,
                content: '좋았어요',
                photos: [],
            }),
        );
    });

    it('정상 작성 성공 — photos key(S3) + 유지분(http) 혼합 → imageUrl 변환', async () => {
        const mixedDto = {
            rating: 4,
            photos: [
                'reviews/photos/uuid_photo.jpg',
                'https://cdn.todam.app/reviews/photos/existing.jpg',
            ],
        };

        findReservationForReview.mockResolvedValue(validReservation);
        existsReviewByReservation.mockResolvedValue(false);
        createReviewWithPhotos.mockResolvedValue({
            ...createdReview,
            photos: [
                {
                    id: 'p1',
                    imageUrl: 'https://cdn.todam.app/reviews/photos/uuid_photo.jpg',
                    sortOrder: 0,
                },
                {
                    id: 'p2',
                    imageUrl: 'https://cdn.todam.app/reviews/photos/existing.jpg',
                    sortOrder: 1,
                },
            ],
        });

        await useCase.execute(USER_ID, RESERVATION_ID, mixedDto);

        const callArg = createReviewWithPhotos.mock.calls[0]?.[0] as {
            photos: { imageUrl: string; sortOrder: number }[];
        };
        expect(callArg.photos[0]?.imageUrl).toBe(
            'https://cdn.todam.app/reviews/photos/uuid_photo.jpg',
        );
        expect(callArg.photos[0]?.sortOrder).toBe(0);
        expect(callArg.photos[1]?.imageUrl).toBe(
            'https://cdn.todam.app/reviews/photos/existing.jpg',
        );
        expect(callArg.photos[1]?.sortOrder).toBe(1);
    });

    it('sortOrder 는 photos 배열 index 순서', async () => {
        const dto = { rating: 3, photos: ['key/a.jpg', 'key/b.jpg', 'key/c.jpg'] };
        findReservationForReview.mockResolvedValue(validReservation);
        existsReviewByReservation.mockResolvedValue(false);
        createReviewWithPhotos.mockResolvedValue(createdReview);

        await useCase.execute(USER_ID, RESERVATION_ID, dto);

        const photos = (
            createReviewWithPhotos.mock.calls[0]?.[0] as { photos: { sortOrder: number }[] }
        ).photos;
        expect(photos.map((p) => p.sortOrder)).toEqual([0, 1, 2]);
    });

    it('예약 없음 → 404 RESERVATION_NOT_FOUND', async () => {
        findReservationForReview.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.RESERVATION_NOT_FOUND,
            status: HttpStatus.NOT_FOUND,
        });
    });

    it('타인 예약 → 403 FORBIDDEN', async () => {
        findReservationForReview.mockResolvedValue({
            ...validReservation,
            userId: 'other-user',
        });

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.FORBIDDEN,
            status: HttpStatus.FORBIDDEN,
        });
    });

    it.each([ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CANCELED])(
        'status=%s → 400 REVIEW_NOT_ALLOWED',
        async (status) => {
            findReservationForReview.mockResolvedValue({ ...validReservation, status });

            await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toMatchObject({
                errorCode: ReviewWriteErrorCode.REVIEW_NOT_ALLOWED,
                status: HttpStatus.BAD_REQUEST,
            });
        },
    );

    it.each([
        ReservationStatus.IN_PROGRESS,
        ReservationStatus.SHIPPED,
        ReservationStatus.DELIVERED,
        ReservationStatus.PICKUP_READY,
        ReservationStatus.PICKUP_DONE,
    ])('status=%s → REVIEW_NOT_ALLOWED 아님', async (status) => {
        findReservationForReview.mockResolvedValue({ ...validReservation, status });
        existsReviewByReservation.mockResolvedValue(false);
        createReviewWithPhotos.mockResolvedValue(createdReview);

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).resolves.toBeTruthy();
    });

    it('scheduledAt + 180일 초과 → 400 REVIEW_DEADLINE_EXCEEDED', async () => {
        const oldScheduledAt = new Date(Date.now() - REVIEW_DEADLINE_MS - 1000);
        findReservationForReview.mockResolvedValue({
            ...validReservation,
            scheduledAt: oldScheduledAt,
        });

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.REVIEW_DEADLINE_EXCEEDED,
            status: HttpStatus.BAD_REQUEST,
        });
    });

    it('scheduledAt + 180일 = now 경계(딱 만료) → 초과', async () => {
        // 정확히 180일 전 + 1ms (이미 초과)
        const boundaryScheduledAt = new Date(Date.now() - REVIEW_DEADLINE_MS - 1);
        findReservationForReview.mockResolvedValue({
            ...validReservation,
            scheduledAt: boundaryScheduledAt,
        });

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.REVIEW_DEADLINE_EXCEEDED,
        });
    });

    it('기존 리뷰 존재 → 409 REVIEW_ALREADY_EXISTS', async () => {
        findReservationForReview.mockResolvedValue(validReservation);
        existsReviewByReservation.mockResolvedValue(true);

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toMatchObject({
            errorCode: ReviewWriteErrorCode.REVIEW_ALREADY_EXISTS,
            status: HttpStatus.CONFLICT,
        });
    });

    it('BusinessException 인스턴스임을 확인', async () => {
        findReservationForReview.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID, RESERVATION_ID, validDto)).rejects.toBeInstanceOf(
            BusinessException,
        );
    });
});

// 무시: EDIT_DEADLINE_MS 는 update spec 에서만 사용
void EDIT_DEADLINE_MS;
