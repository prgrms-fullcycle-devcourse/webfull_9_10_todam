import { HttpStatus, Injectable } from '@nestjs/common';
import { ReviewWriteRequest, ReviewWriteErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ReviewRepository, ReviewRow } from '../../domain/repositories/review.repository';
import { buildReviewPhotos } from '../helpers/build-review-photos';

const EDIT_DEADLINE_MS = 30 * 24 * 60 * 60 * 1000; // 30일

@Injectable()
export class UpdateReviewUseCase {
    constructor(private readonly reviews: ReviewRepository) {}

    async execute(userId: string, reviewId: string, dto: ReviewWriteRequest): Promise<ReviewRow> {
        // ① 리뷰 조회 (photos 포함)
        const review = await this.reviews.findReviewWithPhotos(reviewId);
        if (!review) {
            throw new BusinessException(
                ReviewWriteErrorCode.REVIEW_NOT_FOUND,
                '리뷰를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // ② 리뷰 본인 검증
        if (review.userId !== userId) {
            throw new BusinessException(
                ReviewWriteErrorCode.FORBIDDEN,
                '자신이 직접 등록한 리뷰에 대해서만 수정이 가능합니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // ③ 수정 기한 검증 (createdAt + 30일)
        if (review.createdAt.getTime() + EDIT_DEADLINE_MS < Date.now()) {
            throw new BusinessException(
                ReviewWriteErrorCode.REVIEW_EDIT_DEADLINE_EXCEEDED,
                '리뷰 수정이 가능한 기한(작성일로부터 30일 이내)이 경과하여 수정을 완료할 수 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ④ 트랜잭션: rating·content 갱신 + review_photos 전량 삭제 후 재생성
        const photos = buildReviewPhotos(dto.photos);
        return this.reviews.updateReviewWithPhotos(reviewId, {
            rating: dto.rating,
            content: dto.content ?? null,
            photos,
        });
    }
}
