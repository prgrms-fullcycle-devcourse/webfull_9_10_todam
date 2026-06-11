import { Injectable } from '@nestjs/common';
import { Prisma, StoreTimeSlotStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { StoreTimeSlot, TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';
import {
    ApplyGeneratedGridInput,
    ApplyGeneratedGridResult,
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
        if (query.range) {
            where.startAt = { gte: query.range.start, lt: query.range.end };
        }
        if (query.status) {
            where.status = query.status as StoreTimeSlotStatus;
        }
        const rows = await this.prisma.storeTimeSlot.findMany({
            where,
            orderBy: { startAt: 'asc' },
            select: SLOT_SELECT,
        });
        return rows.map((r) => StoreTimeSlotMapper.toDomain(r));
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
        return rows.map((r) => StoreTimeSlotMapper.toDomain(r));
    }

    async updateStatus(id: string, status: TimeSlotStatus): Promise<StoreTimeSlot> {
        const row = await this.prisma.storeTimeSlot.update({
            where: { id },
            data: { status: status as StoreTimeSlotStatus },
            select: SLOT_SELECT,
        });
        return StoreTimeSlotMapper.toDomain(row);
    }

    async applyGeneratedGrid(input: ApplyGeneratedGridInput): Promise<ApplyGeneratedGridResult> {
        const { storeId, candidates, window, now } = input;

        // 새 격자 식별은 (startAt, endAt) 쌍으로. startAt만 비교하면 interval 변경으로
        // 시작점이 겹치는 슬롯(예: openTime 슬롯)의 옛 endAt(길이)이 그대로 남는다.
        const pairKey = (startAt: Date, endAt: Date): string =>
            `${startAt.getTime()}_${endAt.getTime()}`;
        const candidatePairKeys = new Set(candidates.map((c) => pairKey(c.startAt, c.endAt)));

        return this.prisma.$transaction(async (tx) => {
            // ── prune: 윈도우 내 미래 OPEN 슬롯 중 새 격자에 없는(stale) 것 정리.
            // 과거 슬롯·기존 CLOSED/CANCELED(파트너 수동 조치)는 애초에 조회 대상 제외.
            // (startAt,endAt) 둘 다 새 격자와 일치하면 stale 아님 → 손대지 않아 기존 status 유지.
            const futureOpen = await tx.storeTimeSlot.findMany({
                where: {
                    storeId,
                    status: 'OPEN',
                    startAt: { gt: now, gte: window.start, lt: window.end },
                },
                select: { id: true, startAt: true, endAt: true },
            });
            const staleSlots = futureOpen.filter(
                (s) => !candidatePairKeys.has(pairKey(s.startAt, s.endAt)),
            );

            let removedCount = 0;
            let closedCount = 0;
            if (staleSlots.length > 0) {
                const staleIds = staleSlots.map((s) => s.id);
                const reserved = await tx.reservation.findMany({
                    where: { storeTimeSlotId: { in: staleIds }, status: { not: 'CANCELED' } },
                    select: { storeTimeSlotId: true },
                });
                const reservedIds = new Set(reserved.map((r) => r.storeTimeSlotId));
                // 예약 없는 stale → 삭제. 예약 있는 stale → 삭제 불가(예약 고아 방지)이므로
                // CLOSED 로 전환해 신규 예약 노출/접수에서 제외(고객은 status===OPEN 으로만 노출).
                const deletableIds = staleIds.filter((id) => !reservedIds.has(id));
                const reservedStaleIds = staleIds.filter((id) => reservedIds.has(id));

                if (deletableIds.length > 0) {
                    const deleted = await tx.storeTimeSlot.deleteMany({
                        where: { id: { in: deletableIds } },
                    });
                    removedCount = deleted.count;
                }
                if (reservedStaleIds.length > 0) {
                    const closed = await tx.storeTimeSlot.updateMany({
                        where: { id: { in: reservedStaleIds } },
                        data: { status: 'CLOSED' },
                    });
                    closedCount = closed.count;
                }
            }

            // ── 멱등 생성: 이미 존재하는 startAt 스킵.
            const existing = await tx.storeTimeSlot.findMany({
                where: { storeId, startAt: { in: candidates.map((c) => c.startAt) } },
                select: { startAt: true },
            });
            const existingKeys = new Set(existing.map((e) => e.startAt.getTime()));
            const toCreate = candidates.filter((c) => !existingKeys.has(c.startAt.getTime()));

            const created: StoreTimeSlot[] = [];
            for (const c of toCreate) {
                const slot = await tx.storeTimeSlot.create({
                    data: {
                        storeId,
                        startAt: c.startAt,
                        endAt: c.endAt,
                        status: 'OPEN',
                        reservedCount: 0,
                    },
                    select: SLOT_SELECT,
                });
                created.push(StoreTimeSlotMapper.toDomain(slot));
            }

            return { created, alreadyExisting: existingKeys.size, removedCount, closedCount };
        });
    }
}
