import { Injectable } from '@nestjs/common';
import { Prisma, StoreTimeSlotStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { StoreTimeSlot, TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';
import {
    FindSlotsQuery,
    StoreTimeSlotRepository,
} from '../../domain/repositories/store-time-slot.repository';
import { StoreTimeSlotMapper } from './store-time-slot.mapper';

const SLOT_SELECT = {
    id: true,
    storeId: true,
    startAt: true,
    endAt: true,
    reservedCount: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.StoreTimeSlotSelect;

@Injectable()
export class PrismaStoreTimeSlotRepository extends StoreTimeSlotRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findByStore(storeId: string, query: FindSlotsQuery): Promise<StoreTimeSlot[]> {
        const where: Prisma.StoreTimeSlotWhereInput = { storeId };
        if (query.range) where.startAt = { gte: query.range.start, lt: query.range.end };
        if (query.status) where.status = query.status as StoreTimeSlotStatus;
        const rows = await this.prisma.storeTimeSlot.findMany({
            where,
            orderBy: { startAt: 'asc' },
            select: SLOT_SELECT,
        });
        return rows.map((row) => StoreTimeSlotMapper.toDomain(row));
    }

    async findById(id: string): Promise<StoreTimeSlot | null> {
        const row = await this.prisma.storeTimeSlot.findUnique({
            where: { id },
            select: SLOT_SELECT,
        });
        return row ? StoreTimeSlotMapper.toDomain(row) : null;
    }

    async findByIds(storeId: string, ids: string[]): Promise<StoreTimeSlot[]> {
        if (ids.length === 0) return [];
        const rows = await this.prisma.storeTimeSlot.findMany({
            where: { id: { in: ids }, storeId },
            select: SLOT_SELECT,
        });
        return rows.map((row) => StoreTimeSlotMapper.toDomain(row));
    }

    async updateStatus(id: string, status: TimeSlotStatus): Promise<StoreTimeSlot> {
        const row = await this.prisma.storeTimeSlot.update({
            where: { id },
            data: { status: status as StoreTimeSlotStatus },
            select: SLOT_SELECT,
        });
        return StoreTimeSlotMapper.toDomain(row);
    }
}
