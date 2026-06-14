import { TimeSlotGenerationService, type SlotCandidate } from './time-slot-generation.service';

export interface ReservationWindow {
    startAt: Date;
    endAt: Date;
    participantCount: number;
}

export interface BlockedWindow {
    startAt: Date;
    endAt: Date;
}

export interface VirtualSlotState {
    reservedCount: number;
    remainingCount: number;
    isBlocked: boolean;
    isAvailable: boolean;
}

const overlaps = (left: BlockedWindow, right: BlockedWindow): boolean =>
    left.startAt < right.endAt && right.startAt < left.endAt;

export function evaluateVirtualSlot(
    candidate: SlotCandidate,
    reservations: ReservationWindow[],
    blockedWindows: BlockedWindow[],
    maxCapacity: number,
): VirtualSlotState {
    const overlap = TimeSlotGenerationService.aggregateOverlaps(candidate, reservations);
    const reservedCount = overlap.overlappingParticipantCount;
    const remainingCount = Math.max(0, maxCapacity - reservedCount);
    const isBlocked = blockedWindows.some((blocked) => overlaps(candidate, blocked));

    return {
        reservedCount,
        remainingCount,
        isBlocked,
        isAvailable: !isBlocked && remainingCount > 0,
    };
}

export function slotKey(candidate: SlotCandidate): string {
    return `${candidate.startAt.toISOString()}|${candidate.endAt.toISOString()}`;
}
