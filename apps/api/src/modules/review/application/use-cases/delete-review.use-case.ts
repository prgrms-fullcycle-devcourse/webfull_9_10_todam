import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ReviewActionsErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { S3Service } from '../../../../common/s3/s3.service';
import { ReviewRepository } from '../../domain/repositories/review.repository';

@Injectable()
export class DeleteReviewUseCase {
    private readonly logger = new Logger(DeleteReviewUseCase.name);

    constructor(
        private readonly reviews: ReviewRepository,
        private readonly s3: S3Service,
    ) {}

    async execute(userId: string, reviewId: string): Promise<void> {
        // ① 리뷰 조회 (photos 포함)
        const review = await this.reviews.findReviewWithPhotos(reviewId);
        if (!review) {
            throw new BusinessException(
                ReviewActionsErrorCode.REVIEW_NOT_FOUND,
                '리뷰를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // ② 리뷰 본인 검증
        if (review.userId !== userId) {
            throw new BusinessException(
                ReviewActionsErrorCode.FORBIDDEN,
                '해당 리뷰에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // ③ 트랜잭션: review_photos deleteMany → review delete (hard-delete)
        const imageUrls = review.photos.map((p) => p.imageUrl);
        await this.reviews.deleteReviewCascade(reviewId);

        // ④ S3 이미지 삭제 (DB 커밋 후, 실패는 로깅만/비차단)
        try {
            await this.s3.deleteImageObjects(imageUrls);
        } catch (err) {
            this.logger.error(
                `[review_delete_s3_failed] reviewId=${reviewId} error=${String(err)}`,
            );
        }
    }
}
