import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { OperatingHourInput } from '../../domain/services/time-slot-generation.service';
import {
    ActiveReservationWindow,
    ProgramConfirmedCount,
    TimeslotSupportReader,
} from '../../domain/repositories/timeslot-support.reader';

// ⚠️ 전환 부채: timeslot 외 테이블(StoreOperatingHour / Reservation / Program) 직접 read.
// store/program/reservation 모듈 DDD 전환 시 각 모듈 read 포트로 분해·수렴.
@Injectable()
export class PrismaTimeslotSupportReader extends TimeslotSupportReader {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findOperatingHours(storeId: string): Promise<OperatingHourInput[]> {
        const rows = await this.prisma.storeOperatingHour.findMany({
            where: { storeId },
            select: {
                dayOfWeek: true,
                openTime: true,
                closeTime: true,
                breakStart: true,
                breakEnd: true,
            },
        });
        return rows.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            openTime: r.openTime,
            closeTime: r.closeTime,
            breakStart: r.breakStart,
            breakEnd: r.breakEnd,
        }));
    }

    async findActiveReservationWindows(
        storeId: string,
        range: { start: Date; end: Date },
    ): Promise<ActiveReservationWindow[]> {
        const rows = await this.prisma.reservation.findMany({
            where: {
                storeId,
                status: { not: 'CANCELED' },
                scheduledAt: { lt: range.end },
                scheduledEndAt: { gt: range.start },
            },
            select: {
                scheduledAt: true,
                scheduledEndAt: true,
                participantCount: true,
                status: true,
            },
        });
        return rows.map((row) => ({
            startAt: row.scheduledAt,
            endAt: row.scheduledEndAt,
            participantCount: row.participantCount,
            isConfirmed: row.status === 'CONFIRMED',
        }));
    }

    async countConfirmedBySlotIds(
        storeId: string,
        slotIds: string[],
    ): Promise<Map<string, number>> {
        const result = new Map<string, number>();
        if (slotIds.length === 0) return result;
        const groups = await this.prisma.reservation.groupBy({
            by: ['storeTimeSlotId'],
            where: { storeId, status: 'CONFIRMED', storeTimeSlotId: { in: slotIds } },
            _count: { _all: true },
        });
        for (const g of groups) {
            if (g.storeTimeSlotId) {
                result.set(g.storeTimeSlotId, (g._count as { _all: number })._all);
            }
        }
        return result;
    }

    async countActiveReservations(slotId: string): Promise<number> {
        return this.prisma.reservation.count({
            where: { storeTimeSlotId: slotId, status: { in: ['PENDING', 'CONFIRMED'] } },
        });
    }

    async groupConfirmedByProgram(
        storeId: string,
        slotIds: string[],
    ): Promise<ProgramConfirmedCount[]> {
        if (slotIds.length === 0) return [];
        const groups = await this.prisma.reservation.groupBy({
            by: ['programId'],
            where: { storeId, status: 'CONFIRMED', storeTimeSlotId: { in: slotIds } },
            _count: { _all: true },
        });
        return groups.map((g) => ({
            programId: g.programId,
            count: (g._count as { _all: number })._all,
        }));
    }

    async groupConfirmedByWindows(
        storeId: string,
        windows: Array<{ startAt: Date; endAt: Date }>,
    ): Promise<ProgramConfirmedCount[]> {
        if (windows.length === 0) return [];
        const range = {
            start: new Date(Math.min(...windows.map((window) => window.startAt.getTime()))),
            end: new Date(Math.max(...windows.map((window) => window.endAt.getTime()))),
        };
        const rows = await this.prisma.reservation.findMany({
            where: {
                storeId,
                status: 'CONFIRMED',
                scheduledAt: { lt: range.end },
                scheduledEndAt: { gt: range.start },
            },
            select: { programId: true, scheduledAt: true, scheduledEndAt: true },
        });
        const counts = new Map<string, number>();
        for (const row of rows) {
            if (
                windows.some(
                    (window) =>
                        row.scheduledAt < window.endAt && window.startAt < row.scheduledEndAt,
                )
            ) {
                counts.set(row.programId, (counts.get(row.programId) ?? 0) + 1);
            }
        }
        return [...counts].map(([programId, count]) => ({ programId, count }));
    }

    async findOwnedProgramIds(storeId: string, programIds: string[]): Promise<string[]> {
        if (programIds.length === 0) return [];
        const rows = await this.prisma.program.findMany({
            where: { id: { in: programIds }, storeId },
            select: { id: true },
        });
        return rows.map((r) => r.id);
    }

    async findProgramNames(programIds: string[]): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        if (programIds.length === 0) return result;
        const rows = await this.prisma.program.findMany({
            where: { id: { in: programIds } },
            select: { id: true, title: true },
        });
        for (const r of rows) {
            result.set(r.id, r.title);
        }
        return result;
    }

    async findActiveProgramStore(programId: string): Promise<{
        storeId: string;
        maxCapacityPerSlot: number | null;
        reservationIntervalMinutes: number | null;
    } | null> {
        // 비ACTIVE(DRAFT/INACTIVE)는 미존재 취급 — 공개 상세와 동일 정책.
        const program = await this.prisma.program.findFirst({
            where: { id: programId, status: 'ACTIVE', store: { status: 'PUBLISHED' } },
            select: {
                storeId: true,
                store: {
                    select: {
                        maxCapacityPerSlot: true,
                        reservationIntervalMinutes: true,
                    },
                },
            },
        });
        if (!program) return null;
        return {
            storeId: program.storeId,
            maxCapacityPerSlot: program.store.maxCapacityPerSlot,
            reservationIntervalMinutes: program.store.reservationIntervalMinutes,
        };
    }
}
