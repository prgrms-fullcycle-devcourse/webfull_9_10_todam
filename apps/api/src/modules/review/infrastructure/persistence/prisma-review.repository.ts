import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    CreateReviewInput,
    ReservationForReview,
    ReviewRepository,
    ReviewRow,
    UpdateReviewInput,
} from '../../domain/repositories/review.repository';

@Injectable()
export class PrismaReviewRepository extends ReviewRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findReservationForReview(reservationId: string): Promise<ReservationForReview | null> {
        const row = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            select: {
                userId: true,
                storeId: true,
                scheduledAt: true,
                status: true,
            },
        });
        if (!row) return null;
        return {
            userId: row.userId,
            storeId: row.storeId,
            scheduledAt: row.scheduledAt,
            status: row.status,
        };
    }

    async existsReviewByReservation(reservationId: string): Promise<boolean> {
        const count = await this.prisma.review.count({
            where: { reservationId },
        });
        return count > 0;
    }

    async createReviewWithPhotos(input: CreateReviewInput): Promise<ReviewRow> {
        return this.prisma.$transaction(async (tx) => {
            const review = await tx.review.create({
                data: {
                    reservationId: input.reservationId,
                    userId: input.userId,
                    storeId: input.storeId,
                    rating: input.rating,
                    content: input.content ?? null,
                    photos: {
                        create: input.photos.map((p) => ({
                            imageUrl: p.imageUrl,
                            thumbnailUrl: p.thumbnailUrl,
                            sortOrder: p.sortOrder,
                        })),
                    },
                },
                select: {
                    id: true,
                    reservationId: true,
                    userId: true,
                    rating: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                    photos: {
                        select: { id: true, imageUrl: true, sortOrder: true },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
            return review;
        });
    }

    async findReviewWithPhotos(reviewId: string): Promise<ReviewRow | null> {
        const row = await this.prisma.review.findUnique({
            where: { id: reviewId },
            select: {
                id: true,
                reservationId: true,
                userId: true,
                rating: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                photos: {
                    select: { id: true, imageUrl: true, sortOrder: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        return row ?? null;
    }

    async updateReviewWithPhotos(reviewId: string, input: UpdateReviewInput): Promise<ReviewRow> {
        return this.prisma.$transaction(async (tx) => {
            // 기존 review_photos 전량 삭제 후 재생성
            await tx.reviewPhoto.deleteMany({ where: { reviewId } });

            const review = await tx.review.update({
                where: { id: reviewId },
                data: {
                    rating: input.rating,
                    content: input.content ?? null,
                    photos: {
                        create: input.photos.map((p) => ({
                            imageUrl: p.imageUrl,
                            thumbnailUrl: p.thumbnailUrl,
                            sortOrder: p.sortOrder,
                        })),
                    },
                },
                select: {
                    id: true,
                    reservationId: true,
                    userId: true,
                    rating: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                    photos: {
                        select: { id: true, imageUrl: true, sortOrder: true },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
            return review;
        });
    }
}
