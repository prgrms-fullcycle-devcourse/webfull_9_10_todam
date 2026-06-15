import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, StoreTimeSlotStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PrismaService } from '../../../../database/prisma.service';
import {
    SetTimeSlotBlockStatusInput,
    TimeSlotBlock,
    TimeSlotBlockRepository,
} from '../../domain/repositories/time-slot-block.repository';
import { TimeSlotGenerationService } from '../../domain/services/time-slot-generation.service';

const BLOCK_SELECT = {
    id: true,
    storeId: true,
    startAt: true,
    endAt: true,
    status: true,
    updatedAt: true,
} satisfies Prisma.TimeSlotBlockSelect;

@Injectable()
export class PrismaTimeSlotBlockRepository extends TimeSlotBlockRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findOverlapping(
        storeId: string,
        range: { start: Date; end: Date },
    ): Promise<TimeSlotBlock[]> {
        const rows = await this.prisma.timeSlotBlock.findMany({
            where: {
                storeId,
                startAt: { lt: range.end },
                endAt: { gt: range.start },
            },
            orderBy: { startAt: 'asc' },
            select: BLOCK_SELECT,
        });
        return rows as TimeSlotBlock[];
    }

    async setStatus(input: SetTimeSlotBlockStatusInput): Promise<TimeSlotBlock | null> {
        return this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw(
                Prisma.sql`SELECT id FROM stores WHERE id = ${input.storeId}::uuid FOR UPDATE`,
            );

            if (input.validateCurrentCandidate) {
                const store = await tx.store.findUnique({
                    where: { id: input.storeId },
                    select: {
                        reservationIntervalMinutes: true,
                        operatingHours: {
                            select: {
                                dayOfWeek: true,
                                openTime: true,
                                closeTime: true,
                                breakStart: true,
                                breakEnd: true,
                            },
                        },
                    },
                });
                const valid =
                    store?.reservationIntervalMinutes &&
                    TimeSlotGenerationService.isValidCandidate({
                        startAt: input.startAt,
                        endAt: input.endAt,
                        interval: store.reservationIntervalMinutes,
                        operatingHours: store.operatingHours.map((hour) => ({
                            ...hour,
                            dayOfWeek: hour.dayOfWeek as string,
                        })),
                        now: Date.now(),
                        allowPast: true,
                    });
                if (!valid) {
                    throw new BusinessException(
                        'INVALID_SLOT',
                        '현재 운영 규칙에 유효한 타임슬롯이 아닙니다.',
                        HttpStatus.BAD_REQUEST,
                    );
                }
            }

            if (input.status === 'OPEN') {
                const overlapping = await tx.timeSlotBlock.findMany({
                    where: {
                        storeId: input.storeId,
                        startAt: { lt: input.endAt },
                        endAt: { gt: input.startAt },
                    },
                    select: BLOCK_SELECT,
                });
                if (overlapping.length === 0) return null;

                await tx.timeSlotBlock.deleteMany({
                    where: { id: { in: overlapping.map((block) => block.id) } },
                });
                const remainder = overlapping.flatMap((block) => {
                    const ranges: Array<{
                        storeId: string;
                        startAt: Date;
                        endAt: Date;
                        status: StoreTimeSlotStatus;
                    }> = [];
                    if (block.startAt < input.startAt) {
                        ranges.push({
                            storeId: input.storeId,
                            startAt: block.startAt,
                            endAt: input.startAt,
                            status: block.status,
                        });
                    }
                    if (block.endAt > input.endAt) {
                        ranges.push({
                            storeId: input.storeId,
                            startAt: input.endAt,
                            endAt: block.endAt,
                            status: block.status,
                        });
                    }
                    return ranges;
                });
                if (remainder.length > 0) {
                    await tx.timeSlotBlock.createMany({ data: remainder, skipDuplicates: true });
                }
                return null;
            }

            if (input.status === 'CANCELED') {
                const activeReservations = await tx.reservation.count({
                    where: {
                        storeId: input.storeId,
                        status: { not: 'CANCELED' },
                        scheduledAt: { lt: input.endAt },
                        scheduledEndAt: { gt: input.startAt },
                    },
                });
                if (activeReservations > 0) {
                    throw new Error('ACTIVE_RESERVATIONS_EXIST');
                }
            }

            const oppositeStatus = input.status === 'CLOSED' ? 'CANCELED' : 'CLOSED';
            const oppositeBlocks = await tx.timeSlotBlock.findMany({
                where: {
                    storeId: input.storeId,
                    status: oppositeStatus,
                    startAt: { lt: input.endAt },
                    endAt: { gt: input.startAt },
                },
                select: BLOCK_SELECT,
            });
            if (oppositeBlocks.length > 0) {
                await tx.timeSlotBlock.deleteMany({
                    where: { id: { in: oppositeBlocks.map((block) => block.id) } },
                });
                const remainder = oppositeBlocks.flatMap((block) => {
                    const ranges: Array<{
                        storeId: string;
                        startAt: Date;
                        endAt: Date;
                        status: StoreTimeSlotStatus;
                    }> = [];
                    if (block.startAt < input.startAt) {
                        ranges.push({
                            storeId: input.storeId,
                            startAt: block.startAt,
                            endAt: input.startAt,
                            status: block.status,
                        });
                    }
                    if (block.endAt > input.endAt) {
                        ranges.push({
                            storeId: input.storeId,
                            startAt: input.endAt,
                            endAt: block.endAt,
                            status: block.status,
                        });
                    }
                    return ranges;
                });
                if (remainder.length > 0) {
                    await tx.timeSlotBlock.createMany({ data: remainder, skipDuplicates: true });
                }
            }

            const sameStatus = await tx.timeSlotBlock.findMany({
                where: {
                    storeId: input.storeId,
                    status: input.status as StoreTimeSlotStatus,
                    startAt: { lte: input.endAt },
                    endAt: { gte: input.startAt },
                },
                select: BLOCK_SELECT,
            });
            const startAt = new Date(
                Math.min(
                    input.startAt.getTime(),
                    ...sameStatus.map((block) => block.startAt.getTime()),
                ),
            );
            const endAt = new Date(
                Math.max(
                    input.endAt.getTime(),
                    ...sameStatus.map((block) => block.endAt.getTime()),
                ),
            );
            if (sameStatus.length > 0) {
                await tx.timeSlotBlock.deleteMany({
                    where: { id: { in: sameStatus.map((block) => block.id) } },
                });
            }
            const created = await tx.timeSlotBlock.create({
                data: {
                    storeId: input.storeId,
                    startAt,
                    endAt,
                    status: input.status as StoreTimeSlotStatus,
                },
                select: BLOCK_SELECT,
            });
            return created as TimeSlotBlock;
        });
    }
}
