import { TimeSlotStatus } from '../entities/store-time-slot.entity';

export interface TimeSlotBlock {
    id: string;
    storeId: string;
    startAt: Date;
    endAt: Date;
    status: Exclude<TimeSlotStatus, 'OPEN'>;
    updatedAt: Date;
}

export interface SetTimeSlotBlockStatusInput {
    storeId: string;
    startAt: Date;
    endAt: Date;
    status: TimeSlotStatus;
    validateCurrentCandidate: boolean;
}

export abstract class TimeSlotBlockRepository {
    abstract findOverlapping(
        storeId: string,
        range: { start: Date; end: Date },
    ): Promise<TimeSlotBlock[]>;

    abstract setStatus(input: SetTimeSlotBlockStatusInput): Promise<TimeSlotBlock | null>;
}
