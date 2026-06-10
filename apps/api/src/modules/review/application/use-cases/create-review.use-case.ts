import { HttpStatus, Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { ReviewWriteRequest, ReviewWriteErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ReviewRepository, ReviewRow } from '../../domain/repositories/review.repository';
import { buildReviewPhotos } from '../helpers/build-review-photos';

/** 리뷰 작성 허용 예약 상태 집합 */
const ALLOWED_STATUSES = new Set<ReservationStatus>([
    ReservationStatus.IN_PROGRESS,
    ReservationStatus.SHIPPED,
    ReservationStatus.DELIVERED,
    ReservationStatus.PICKUP_READY,
    ReservationStatus.PICKUP_DONE,
]);

const REVIEW_DEADLINE_MS = 180 * 24 * 60 * 60 * 1000; // 180일

@Injectable()
export class CreateReviewUseCase {
    constructor(private readonly reviews: ReviewRepository) {}

    async execute(
        userId: string,
        reservationId: string,
        dto: ReviewWriteRequest,
    ): Promise<ReviewRow> {
        // ① 예약 조회
        const reservation = await this.reviews.findReservationForReview(reservationId);
        if (!reservation) {
            throw new BusinessException(
                ReviewWriteErrorCode.RESERVATION_NOT_FOUND,
                '요청하신 예약 정보를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // ② 예약 본인 검증
        if (reservation.userId !== userId) {
            throw new BusinessException(
                ReviewWriteErrorCode.FORBIDDEN,
                '본인이 참여한 예약 정보에 대해서만 리뷰 작성이 허용됩니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // ③ 작성 허용 상태 검증
        if (!ALLOWED_STATUSES.has(reservation.status)) {
            throw new BusinessException(
                ReviewWriteErrorCode.REVIEW_NOT_ALLOWED,
                '체험 완료 후 리뷰를 작성할 수 있습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ④ 180일 기한 검증 (scheduledAt + 180일)
        if (reservation.scheduledAt.getTime() + REVIEW_DEADLINE_MS < Date.now()) {
            throw new BusinessException(
                ReviewWriteErrorCode.REVIEW_DEADLINE_EXCEEDED,
                '리뷰 작성 기한(체험일로부터 180일 이내)이 이미 초과되어 작성할 수 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ⑤ 중복 리뷰 검증 (reservation unique)
        const exists = await this.reviews.existsReviewByReservation(reservationId);
        if (exists) {
            throw new BusinessException(
                ReviewWriteErrorCode.REVIEW_ALREADY_EXISTS,
                '이미 리뷰를 작성한 예약입니다.',
                HttpStatus.CONFLICT,
            );
        }

        // ⑥ 트랜잭션: Review + ReviewPhoto 생성
        const photos = buildReviewPhotos(dto.photos);
        return this.reviews.createReviewWithPhotos({
            reservationId,
            userId,
            storeId: reservation.storeId,
            rating: dto.rating,
            content: dto.content ?? null,
            photos,
        });
    }
}
