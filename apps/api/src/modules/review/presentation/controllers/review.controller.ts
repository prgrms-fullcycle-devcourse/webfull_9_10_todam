import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { reviewWriteRequestSchema, reviewImageUploadRequestSchema } from '@todam/shared';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { UpdateReviewUseCase } from '../../application/use-cases/update-review.use-case';
import { IssueReviewImagePresignedUseCase } from '../../application/use-cases/issue-review-image-presigned.use-case';
import { GetReviewDetailUseCase } from '../../application/use-cases/get-review-detail.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import {
    ReviewCreateResultDto,
    ReviewDetailResultDto,
    ReviewUpdateResultDto,
    ReviewImageUploadResultDto,
    ReviewWriteRequestDto,
    ReviewImageUploadRequestDto,
} from '../dto/review.dto';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller()
export class ReviewController {
    constructor(
        private readonly createReview: CreateReviewUseCase,
        private readonly updateReview: UpdateReviewUseCase,
        private readonly issuePresigned: IssueReviewImagePresignedUseCase,
        private readonly getReviewDetail: GetReviewDetailUseCase,
        private readonly deleteReview: DeleteReviewUseCase,
    ) {}

    @Post('reservations/:reservationId/review')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(AuthGuard)
    @ResponseMessage('리뷰가 성공적으로 등록되었습니다.')
    @ApiCreatedResponse({ description: '리뷰 작성 성공', type: ReviewCreateResultDto })
    @ApiBody({ type: ReviewWriteRequestDto })
    async createReviewHandler(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
        @Body(new BodyZodValidationPipe(reviewWriteRequestSchema)) dto: ReviewWriteRequestDto,
    ): Promise<ReviewCreateResultDto> {
        const row = await this.createReview.execute(user.id, reservationId, dto);
        return {
            review: {
                id: row.id,
                reservationId: row.reservationId,
                rating: row.rating,
                content: row.content ?? '',
                photos: row.photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl })),
                createdAt: row.createdAt.toISOString(),
            },
        };
    }

    @Patch('reviews/:reviewId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('리뷰가 성공적으로 수정되었습니다.')
    @ApiOkResponse({ description: '리뷰 수정 성공', type: ReviewUpdateResultDto })
    @ApiBody({ type: ReviewWriteRequestDto })
    async updateReviewHandler(
        @CurrentUser() user: RequestUser,
        @Param('reviewId') reviewId: string,
        @Body(new BodyZodValidationPipe(reviewWriteRequestSchema)) dto: ReviewWriteRequestDto,
    ): Promise<ReviewUpdateResultDto> {
        const row = await this.updateReview.execute(user.id, reviewId, dto);
        return {
            review: {
                id: row.id,
                rating: row.rating,
                content: row.content ?? '',
                photos: row.photos.map((p) => p.imageUrl),
                updatedAt: row.updatedAt.toISOString(),
            },
        };
    }

    @Post('review/images/presigned')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(AuthGuard)
    @ResponseMessage(
        'Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.',
    )
    @ApiCreatedResponse({
        description: '리뷰 이미지 presigned URL 발급 성공',
        type: ReviewImageUploadResultDto,
    })
    @ApiBody({ type: ReviewImageUploadRequestDto })
    async issuePresignedHandler(
        @CurrentUser() _user: RequestUser,
        @Body(new BodyZodValidationPipe(reviewImageUploadRequestSchema))
        dto: ReviewImageUploadRequestDto,
    ): Promise<ReviewImageUploadResultDto> {
        return this.issuePresigned.execute(dto);
    }

    @Get('reservations/:reservationId/review')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('리뷰가 성공적으로 조회되었습니다.')
    @ApiOkResponse({ description: '리뷰 상세 조회 성공', type: ReviewDetailResultDto })
    async getReviewDetailHandler(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
    ): Promise<ReviewDetailResultDto> {
        const row = await this.getReviewDetail.execute(user.id, reservationId);
        return {
            review: {
                id: row.id,
                reservationId: row.reservationId,
                rating: row.rating,
                content: row.content ?? '',
                photos: row.photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl })),
                createdAt: row.createdAt.toISOString(),
            },
        };
    }

    @Delete('reviews/:reviewId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('리뷰가 성공적으로 삭제되었습니다.')
    @ApiOkResponse({ description: '리뷰 삭제 성공' })
    async deleteReviewHandler(
        @CurrentUser() user: RequestUser,
        @Param('reviewId') reviewId: string,
    ): Promise<null> {
        await this.deleteReview.execute(user.id, reviewId);
        return null;
    }
}
