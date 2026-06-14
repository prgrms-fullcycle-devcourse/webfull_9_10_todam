import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { kstDayRange, parseDateOnly } from '../../../../common/date/kst-date.util';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import { ReservationRestrictionRepository } from '../../domain/repositories/reservation-restriction.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { TimeSlotGenerationService } from '../../domain/services/time-slot-generation.service';
import { evaluateVirtualSlot, slotKey } from '../../domain/services/virtual-time-slot.service';
import type {
    ListTimeSlotsQueryDto,
    ListTimeSlotsResponseDto,
} from '../../presentation/dto/list-time-slots.dto';

@Injectable()
export class ListTimeSlotsUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly slots: StoreTimeSlotRepository,
        private readonly restrictions: ReservationRestrictionRepository,
        private readonly support: TimeslotSupportReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        query: ListTimeSlotsQueryDto,
    ): Promise<ListTimeSlotsResponseDto> {
        const store = await this.ownership.verify(userId, storeId);
        const resolved = this.resolveRange(query);
        if (!store.reservationIntervalMinutes || !store.maxCapacityPerSlot) {
            return { slots: [] };
        }

        const operatingHours = await this.support.findOperatingHours(storeId);
        const { candidates } = TimeSlotGenerationService.buildCandidates({
            interval: store.reservationIntervalMinutes,
            operatingHours,
            startParts: resolved.startParts,
            endParts: resolved.endParts,
            now: Date.now(),
            includePast: true,
        });
        const [reservations, blockedSlots, restrictions] = await Promise.all([
            this.support.findActiveReservationWindows(storeId, resolved.range),
            this.slots.findOverlappingBlocked(storeId, resolved.range),
            this.restrictions.findOverlapping(storeId, resolved.range),
        ]);

        const result = candidates.map((candidate) => {
            const overlappingBlocked = blockedSlots.filter(
                (slot) => slot.startAt < candidate.endAt && candidate.startAt < slot.endAt,
            );
            const overlappingRestrictions = restrictions.filter(
                (restriction) =>
                    restriction.startAt < candidate.endAt && candidate.startAt < restriction.endAt,
            );
            const state = evaluateVirtualSlot(
                candidate,
                reservations,
                [...overlappingBlocked, ...overlappingRestrictions],
                store.maxCapacityPerSlot!,
            );
            const status = overlappingBlocked.some((slot) => slot.status === 'CANCELED')
                ? ('CANCELED' as const)
                : overlappingBlocked.length > 0
                  ? ('CLOSED' as const)
                  : ('OPEN' as const);
            const confirmedReservationCount = reservations.filter(
                (reservation) =>
                    reservation.isConfirmed &&
                    reservation.startAt < candidate.endAt &&
                    candidate.startAt < reservation.endAt,
            ).length;
            const restrictedProgramIds = [
                ...new Set(overlappingRestrictions.map((restriction) => restriction.programId)),
            ];
            return {
                slotKey: slotKey(candidate),
                startAt: candidate.startAt.toISOString(),
                endAt: candidate.endAt.toISOString(),
                reservedCount: state.reservedCount,
                remainingCount: state.remainingCount,
                status,
                confirmedReservationCount,
                isAvailable: state.isAvailable,
                isRestricted: restrictedProgramIds.length > 0,
                restrictedProgramIds,
                blockingSlotKeys: overlappingBlocked.map((slot) =>
                    slotKey({ startAt: slot.startAt, endAt: slot.endAt }),
                ),
            };
        });

        return {
            slots: query.status ? result.filter((slot) => slot.status === query.status) : result,
        };
    }

    private resolveRange(query: ListTimeSlotsQueryDto): {
        range: { start: Date; end: Date };
        startParts: { year: number; month: number; day: number };
        endParts: { year: number; month: number; day: number };
    } {
        const startParts = parseDateOnly(query.date ?? query.startDate!);
        const endParts = parseDateOnly(query.date ?? query.endDate!);
        if (!startParts || !endParts) {
            throw new BusinessException(
                'INVALID_DATE_RANGE',
                '날짜 범위가 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }
        const startKey = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
        const endKey = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
        const days = (endKey - startKey) / (24 * 60 * 60 * 1000) + 1;
        if (days < 1 || days > 92) {
            throw new BusinessException(
                'INVALID_DATE_RANGE',
                '조회 범위는 최대 92일이어야 합니다.',
                HttpStatus.BAD_REQUEST,
            );
        }
        return {
            range: { start: kstDayRange(startParts).start, end: kstDayRange(endParts).end },
            startParts,
            endParts,
        };
    }
}
