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

    async createManyIdempotent(items: NewRestriction[]): Promise<ReservationRestriction[]> {
        if (items.length === 0) return [];
        return this.prisma.$transaction(async (tx) => {
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
                    select: { id: true },
                });
                if (existing) continue; // 멱등 — 이미 있으면 스킵.

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
        const result = await this.prisma.reservationRestriction.deleteMany({
            where: { id: { in: ids }, storeId },
        });
        return result.count;
    }

    async deleteByConditions(
        storeId: string,
        conditions: DeleteRestrictionConditions,
    ): Promise<number> {
        const where: Prisma.ReservationRestrictionWhereInput = { storeId };
        if (conditions.startAts && conditions.startAts.length > 0) {
            where.startAt = { in: conditions.startAts };
        } else if (conditions.range) {
            where.startAt = { gte: conditions.range.start, lt: conditions.range.end };
        }
        if (conditions.programIds && conditions.programIds.length > 0) {
            where.programId = { in: conditions.programIds };
        }
        const result = await this.prisma.reservationRestriction.deleteMany({ where });
        return result.count;
    }
}
