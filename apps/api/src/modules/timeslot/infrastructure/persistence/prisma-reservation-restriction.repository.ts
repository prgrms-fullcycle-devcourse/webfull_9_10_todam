import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ReservationRestriction } from '../../domain/entities/reservation-restriction.entity';
import {
    DeleteRestrictionConditions,
    NewRestriction,
    ReservationRestrictionRepository,
} from '../../domain/repositories/reservation-restriction.repository';
import { ReservationRestrictionMapper } from './reservation-restriction.mapper';

const RESTRICTION_SELECT = {
    id: true,
    storeId: true,
    startAt: true,
    endAt: true,
    programId: true,
    createdBy: true,
    createdAt: true,
} satisfies Prisma.ReservationRestrictionSelect;

@Injectable()
export class PrismaReservationRestrictionRepository extends ReservationRestrictionRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findByStartAts(storeId: string, startAts: Date[]): Promise<ReservationRestriction[]> {
        if (startAts.length === 0) return [];
        const rows = await this.prisma.reservationRestriction.findMany({
            where: { storeId, startAt: { in: startAts } },
            select: RESTRICTION_SELECT,
        });
        return rows.map((r) => ReservationRestrictionMapper.toDomain(r));
    }

    async findOverlapping(
        storeId: string,
        range: { start: Date; end: Date },
    ): Promise<ReservationRestriction[]> {
        const rows = await this.prisma.reservationRestriction.findMany({
            where: {
                storeId,
                startAt: { lt: range.end },
                endAt: { gt: range.start },
            },
            select: RESTRICTION_SELECT,
        });
        return rows.map((row) => ReservationRestrictionMapper.toDomain(row));
    }

    async createManyIdempotent(items: NewRestriction[]): Promise<ReservationRestriction[]> {
        if (items.length === 0) return [];
        return this.prisma.$transaction(async (tx) => {
            for (const storeId of [...new Set(items.map((item) => item.storeId))].sort()) {
                await tx.$queryRaw(
                    Prisma.sql`SELECT id FROM stores WHERE id = ${storeId}::uuid FOR UPDATE`,
                );
            }
            const created: ReservationRestriction[] = [];
            for (const item of items) {
                const existing = await tx.reservationRestriction.findUnique({
                    where: {
                        storeId_startAt_programId: {
                            storeId: item.storeId,
                            startAt: item.startAt,
                            programId: item.programId,
                        },
                    },
                    select: RESTRICTION_SELECT,
                });
                if (existing) {
                    if (existing.endAt.getTime() !== item.endAt.getTime()) {
                        const updated = await tx.reservationRestriction.update({
                            where: { id: existing.id },
                            data: { endAt: item.endAt, createdBy: item.createdBy },
                            select: RESTRICTION_SELECT,
                        });
                        created.push(ReservationRestrictionMapper.toDomain(updated));
                    }
                    continue;
                }

                const row = await tx.reservationRestriction.create({
                    data: {
                        storeId: item.storeId,
                        startAt: item.startAt,
                        endAt: item.endAt,
                        programId: item.programId,
                        createdBy: item.createdBy,
                    },
                    select: RESTRICTION_SELECT,
                });
                created.push(ReservationRestrictionMapper.toDomain(row));
            }
            return created;
        });
    }

    async deleteByIds(storeId: string, ids: string[]): Promise<number> {
        if (ids.length === 0) return 0;
        return this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw(
                Prisma.sql`SELECT id FROM stores WHERE id = ${storeId}::uuid FOR UPDATE`,
            );
            const result = await tx.reservationRestriction.deleteMany({
                where: { id: { in: ids }, storeId },
            });
            return result.count;
        });
    }

    async deleteByConditions(
        storeId: string,
        conditions: DeleteRestrictionConditions,
    ): Promise<number> {
        const where: Prisma.ReservationRestrictionWhereInput = { storeId };
        if (conditions.timeRanges && conditions.timeRanges.length > 0) {
            where.OR = conditions.timeRanges.map((range) => ({
                startAt: range.startAt,
                endAt: range.endAt,
            }));
        } else if (conditions.range) {
            where.startAt = { gte: conditions.range.start, lt: conditions.range.end };
        }
        if (conditions.programIds && conditions.programIds.length > 0) {
            where.programId = { in: conditions.programIds };
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw(
                Prisma.sql`SELECT id FROM stores WHERE id = ${storeId}::uuid FOR UPDATE`,
            );
            const result = await tx.reservationRestriction.deleteMany({ where });
            return result.count;
        });
    }
}
