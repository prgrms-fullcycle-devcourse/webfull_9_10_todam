import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { verifyStoreOwnership } from '../verify-store-ownership';
import type {
    ProgramReservationCountsQueryDto,
    ProgramReservationCountsResponseDto,
} from '../../presentation/dto/program-reservation-counts.dto';
import { kstDayRange, parseDateOnly } from '../time.util';

@Injectable()
export class GetProgramReservationCountsUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        query: ProgramReservationCountsQueryDto,
    ): Promise<ProgramReservationCountsResponseDto> {
        await verifyStoreOwnership(this.prisma, userId, storeId);

        const dateParts = parseDateOnly(query.date);
        if (!dateParts) {
            throw new BusinessException(
                'INVALID_DATE_FORMAT',
                'date 형식이 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 대상 슬롯 결정: timeSlotIds 지정 시 그 슬롯들, 아니면 date 전체 슬롯.
        const slotIds = (query.timeSlotIds ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        let targetSlotIds: string[];
        if (slotIds.length > 0) {
            const slots = await this.prisma.storeTimeSlot.findMany({
                where: { id: { in: slotIds }, storeId },
                select: { id: true },
            });
            targetSlotIds = slots.map((s) => s.id);
        } else {
            const { start, end } = kstDayRange(dateParts);
            const slots = await this.prisma.storeTimeSlot.findMany({
                where: { storeId, startAt: { gte: start, lt: end } },
                select: { id: true },
            });
            targetSlotIds = slots.map((s) => s.id);
        }

        if (targetSlotIds.length === 0) {
            return { programs: [] };
        }

        // 프로그램별 CONFIRMED 예약 집계.
        const groups = await this.prisma.reservation.groupBy({
            by: ['programId'],
            where: {
                storeId,
                status: 'CONFIRMED',
                storeTimeSlotId: { in: targetSlotIds },
            },
            _count: { _all: true },
        });

        if (groups.length === 0) {
            return { programs: [] };
        }

        const programIds = groups.map((g) => g.programId);
        const programs = await this.prisma.program.findMany({
            where: { id: { in: programIds } },
            select: { id: true, title: true },
        });
        const nameById = new Map<string, string>();
        for (const p of programs) {
            nameById.set(p.id, p.title);
        }

        return {
            programs: groups.map((g) => ({
                programId: g.programId,
                programName: nameById.get(g.programId) ?? '',
                confirmedReservationCount: (g._count as { _all: number })._all,
            })),
        };
    }
}
