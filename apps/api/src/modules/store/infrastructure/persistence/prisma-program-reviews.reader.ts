import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramEditErrorCode } from '@todam/shared';
import type {
    ListProgramReviewsQuery,
    ListProgramReviewsResult,
    ProgramReviewListItem,
} from '../../domain/repositories/store-readers';
import { maskNickname } from './review-author-mask.util';

@Injectable()
export class PrismaProgramReviewsReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        slug: string,
        programId: string,
        query: ListProgramReviewsQuery,
    ): Promise<ListProgramReviewsResult> {
        const { page, limit, sort } = query;

        // 프로그램 존재·소속·공개 검증: slug 공방이 PUBLISHED 이고 해당 프로그램이 소속된 경우만 허용.
        const program = await this.prisma.program.findFirst({
            where: {
                id: programId,
                store: { slug, status: StoreStatus.PUBLISHED },
            },
            select: { id: true },
        });
        if (!program) {
            throw new BusinessException(
                ProgramEditErrorCode.PROGRAM_NOT_FOUND,
                '프로그램을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const where = {
            isVisible: true,
            reservation: { programId },
        } as const;

        const orderBy =
            sort === 'rating_high'
                ? [{ rating: 'desc' as const }, { createdAt: 'desc' as const }]
                : [{ createdAt: 'desc' as const }];

        const skip = (page - 1) * limit;

        const [rows, totalCount, aggregate] = await Promise.all([
            this.prisma.review.findMany({
                where,
                include: {
                    user: { select: { nickname: true } },
                    photos: {
                        select: { imageUrl: true, sortOrder: true },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.review.count({ where }),
            this.prisma.review.aggregate({
                where,
                _avg: { rating: true },
            }),
        ]);

        const avgRaw = aggregate._avg.rating;
        const averageRating = avgRaw !== null ? Math.round(avgRaw * 10) / 10 : 0;

        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

        const reviews: ProgramReviewListItem[] = rows.map((row) => ({
            id: row.id,
            userId: '',
            nickname: maskNickname(row.user.nickname),
            rating: row.rating,
            content: row.content ?? '',
            photos: row.photos.map((p) => ({ imageUrl: p.imageUrl })),
            createdAt: row.createdAt.toISOString(),
        }));

        return {
            totalCount,
            averageRating,
            reviews,
            pagination: {
                currentPage: page,
                totalPages,
                limit,
            },
        };
    }
}
