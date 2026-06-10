import { HttpStatus, Injectable } from '@nestjs/common';
import { ReviewActionsErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ReviewRepository, ReviewRow } from '../../domain/repositories/review.repository';

@Injectable()
export class GetReviewDetailUseCase {
    constructor(private readonly reviews: ReviewRepository) {}

    async execute(userId: string, reservationId: string): Promise<ReviewRow> {
        // ① 예약 소유자 검증 — reservation 조회 후 userId 확인
        const reservation = await this.reviews.findReservationForReview(reservationId);
        if (!reservation || reservation.userId !== userId) {
            throw new BusinessException(
                ReviewActionsErrorCode.FORBIDDEN,
                '해당 리뷰에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // ② 리뷰 조회 (photos sortOrder ASC 포함)
        const review = await this.reviews.findReviewByReservationWithPhotos(reservationId);
        if (!review) {
            throw new BusinessException(
                ReviewActionsErrorCode.REVIEW_NOT_FOUND,
                '리뷰를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        return review;
    }
}
