import { StoreTimeSlot, TimeSlotStatus } from '../entities/store-time-slot.entity';

export interface FindSlotsQuery {
    range?: { start: Date; end: Date };
    status?: TimeSlotStatus;
}

export abstract class StoreTimeSlotRepository {
    abstract findByStore(storeId: string, query: FindSlotsQuery): Promise<StoreTimeSlot[]>;
    abstract findById(id: string): Promise<StoreTimeSlot | null>;
    abstract findByIds(storeId: string, ids: string[]): Promise<StoreTimeSlot[]>;
    abstract updateStatus(id: string, status: TimeSlotStatus): Promise<StoreTimeSlot>;
}
