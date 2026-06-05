// Prisma row ↔ StoreTimeSlot 도메인 엔티티 변환.

import { StoreTimeSlot, TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';

export interface StoreTimeSlotRow {
    id: string;
    storeId: string;
    startAt: Date;
    endAt: Date;
    reservedCount: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export class StoreTimeSlotMapper {
    static toDomain(row: StoreTimeSlotRow): StoreTimeSlot {
        return new StoreTimeSlot(
            row.id,
            row.storeId,
            row.startAt,
            row.endAt,
            row.reservedCount,
            row.status as TimeSlotStatus,
            row.createdAt,
            row.updatedAt,
        );
    }
}
