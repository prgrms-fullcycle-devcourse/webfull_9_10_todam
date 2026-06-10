import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { UpdateReviewUseCase } from './application/use-cases/update-review.use-case';
import { IssueReviewImagePresignedUseCase } from './application/use-cases/issue-review-image-presigned.use-case';
import { GetReviewDetailUseCase } from './application/use-cases/get-review-detail.use-case';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case';
import { ReviewRepository } from './domain/repositories/review.repository';
import { PrismaReviewRepository } from './infrastructure/persistence/prisma-review.repository';
import { ReviewController } from './presentation/controllers/review.controller';

// S3Service 는 @Global() S3Module 에서 전역 제공되므로 별도 import 불필요.
@Module({
    imports: [AuthModule],
    controllers: [ReviewController],
    providers: [
        CreateReviewUseCase,
        UpdateReviewUseCase,
        IssueReviewImagePresignedUseCase,
        GetReviewDetailUseCase,
        DeleteReviewUseCase,
        { provide: ReviewRepository, useClass: PrismaReviewRepository },
    ],
})
export class ReviewModule {}
