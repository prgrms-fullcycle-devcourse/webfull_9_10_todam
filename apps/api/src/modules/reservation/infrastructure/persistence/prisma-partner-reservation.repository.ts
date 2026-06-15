import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    Prisma,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
    StoreStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
    CancelReservationResult,
    CompleteReservationResult,
    ConfirmReservationResult,
    CreateManualReservationInput,
    CreateManualReservationResult,
    PartnerReservationActionRow,
    PartnerReservationCalendarData,
    PartnerReservationDetailRow,
    PartnerReservationListQuery,
    PartnerReservationListRow,
    PartnerReservationRepository,
    PendingReservationDateCount,
    RejectReservationResult,
} from '../../domain/repositories/partner-reservation.repository';
import {
    assertReservationStatusTransition,
    decrementReservedCount,
} from './reservation-slot-count';
import { lockStore, materializeBookingSlot } from './booking-core';

@Injectable()
export class PrismaPartnerReservationRepository extends PartnerReservationRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findCalendarData(
        storeId: string,
        range: { start: Date; end: Date },
    ): Promise<PartnerReservationCalendarData> {
        const [reservations, slots, restrictions, operatingHours] = await Promise.all([
            this.prisma.reservation.findMany({
                where: {
                    storeId,
                    scheduledAt: { gte: range.start, lt: range.end },
                    status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
                },
                select: { scheduledAt: true },
            }),
            this.prisma.storeTimeSlot.findMany({
                where: { storeId, startAt: { gte: range.start, lt: range.end } },
                select: { startAt: true, status: true, reservedCount: true },
            }),
            this.prisma.reservationRestriction.findMany({
                where: { storeId, startAt: { gte: range.start, lt: range.end } },
                select: { startAt: true },
            }),
            this.prisma.storeOperatingHour.findMany({
                where: { storeId },
                select: { dayOfWeek: true },
            }),
        ]);

        return { reservations, slots, restrictions, operatingHours };
    }

    async findList(
        storeId: string,
        query: PartnerReservationListQuery,
    ): Promise<PartnerReservationListRow[]> {
        const where: Prisma.ReservationWhereInput = {
            storeId,
            scheduledAt: { gte: query.range.start, lt: query.range.end },
            ...(query.status ? { status: query.status } : {}),
            ...(query.programId ? { programId: query.programId } : {}),
        };

        const rows = await this.prisma.reservation.findMany({
            where,
            orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
            cursor: query.cursor ? { id: query.cursor } : undefined,
            skip: query.cursor ? 1 : 0,
            take: query.limit + 1,
            select: {
                id: true,
                scheduledAt: true,
                reserverName: true,
                participantCount: true,
                status: true,
                source: true,
                createdAt: true,
                program: { select: { title: true, durationMinutes: true } },
            },
        });

        return rows.map((row) => ({
            ...row,
            programTitle: row.program.title,
            durationMinutes: row.program.durationMinutes,
        }));
    }

    async countPendingByKstDate(
        storeId: string,
        start: Date,
    ): Promise<PendingReservationDateCount[]> {
        return this.prisma.$queryRaw<PendingReservationDateCount[]>(Prisma.sql`
            SELECT
                TO_CHAR(("scheduled_at" AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS "date",
                COUNT(*)::int AS "reservationCount"
            FROM "reservations"
            WHERE "store_id" = ${storeId}::uuid
              AND "status" = ${ReservationStatus.PENDING}::"ReservationStatus"
              AND "scheduled_at" >= ${start}
            GROUP BY ("scheduled_at" AT TIME ZONE 'Asia/Seoul')::date
            ORDER BY ("scheduled_at" AT TIME ZONE 'Asia/Seoul')::date ASC
        `);
    }

    async findDetail(reservationId: string): Promise<PartnerReservationDetailRow | null> {
        const row = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            select: {
                id: true,
                status: true,
                scheduledAt: true,
                participantCount: true,
                reserverName: true,
                reserverPhone: true,
                internalMemo: true,
                canceledAt: true,
                cancelReason: true,
                createdAt: true,
                artwork: { select: { id: true } },
                program: { select: { title: true } },
                store: { select: { partner: { select: { userId: true } } } },
            },
        });

        if (!row) return null;
        return {
            ...row,
            artworkId: row.artwork?.id ?? null,
            programTitle: row.program.title,
            partnerUserId: row.store.partner.userId,
        };
    }

    async createManual(
        storeId: string,
        input: CreateManualReservationInput,
    ): Promise<CreateManualReservationResult | null> {
        return this.prisma.$transaction(async (tx) => {
            await lockStore(tx, storeId);
            const program = await tx.program.findFirst({
                where: {
                    id: input.programId,
                    storeId,
                    status: 'ACTIVE',
                    store: { status: StoreStatus.PUBLISHED },
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    leadTimeDays: true,
                    deliverable: true,
                    store: { select: { maxCapacityPerSlot: true } },
                },
            });

            if (!program) return null;
            const [slotKeyStart, slotKeyEnd] = input.slotKey?.split('|') ?? [];
            const slot = await materializeBookingSlot(tx, {
                storeId,
                programId: program.id,
                participantCount: input.participantCount,
                slotId: input.slotId,
                startAt: input.startAt ?? slotKeyStart,
                expectedEndAt: slotKeyEnd,
                allowPast: true,
            });

            const snapshot = await tx.programSnapshot.create({
                data: {
                    programId: program.id,
                    price: program.price,
                    leadTimeDays: program.leadTimeDays,
                },
                select: { id: true },
            });

            const deliveryMethod = program.deliverable
                ? (input.deliveryMethod ?? ReservationDeliveryMethod.PICKUP)
                : ReservationDeliveryMethod.PICKUP;

            const reservation = await tx.reservation.create({
                data: {
                    userId: null,
                    programId: program.id,
                    storeId,
                    storeTimeSlotId: slot.id,
                    programSnapshotId: snapshot.id,
                    scheduledAt: slot.startAt,
                    scheduledEndAt: slot.endAt,
                    reserverName: input.reserverName,
                    reserverPhone: input.reserverPhone,
                    participantCount: input.participantCount,
                    deliveryMethod,
                    status: input.initialStatus,
                    internalMemo: input.internalMemo ?? null,
                    source: ReservationSource.PARTNER_MANUAL,
                },
                select: {
                    id: true,
                    reserverName: true,
                    status: true,
                    source: true,
                    createdAt: true,
                },
            });

            // 체험완료(IN_PROGRESS)로 직접 등록하면 제작 시작 상태(건조)로 둔다.
            const artwork = await tx.artwork.create({
                data: {
                    reservationId: reservation.id,
                    title: program.title,
                    internalMemo: input.internalMemo ?? null,
                    status:
                        input.initialStatus === ReservationStatus.IN_PROGRESS
                            ? ArtworkStatus.DRYING
                            : ArtworkStatus.RESERVED,
                },
                select: { id: true },
            });

            await tx.artworkLog.create({
                data: {
                    artworkId: artwork.id,
                    changedBy: input.changedBy,
                    fromStatus: null,
                    toStatus:
                        input.initialStatus === ReservationStatus.IN_PROGRESS
                            ? ArtworkStatus.DRYING
                            : ArtworkStatus.RESERVED,
                },
            });

            await tx.qrToken.create({
                data: { artworkId: artwork.id, token: this.createQrToken(artwork.id) },
            });

            return { reservation, artwork };
        });
    }

    async findForAction(reservationId: string): Promise<PartnerReservationActionRow | null> {
        const row = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            select: {
                id: true,
                userId: true,
                storeId: true,
                storeTimeSlotId: true,
                status: true,
                scheduledAt: true,
                participantCount: true,
                artwork: { select: { id: true, status: true } },
                program: { select: { title: true } },
                store: { select: { partner: { select: { userId: true } } } },
            },
        });

        if (!row) return null;
        return {
            id: row.id,
            storeId: row.storeId,
            storeTimeSlotId: row.storeTimeSlotId,
            status: row.status,
            scheduledAt: row.scheduledAt,
            participantCount: row.participantCount,
            artwork: row.artwork,
            programTitle: row.program.title,
            partnerUserId: row.store.partner.userId,
            customerUserId: row.userId,
        };
    }

    async confirm(reservation: PartnerReservationActionRow): Promise<ConfirmReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            await assertReservationStatusTransition(tx, reservation.id, reservation.status, {
                status: ReservationStatus.CONFIRMED,
            });

            const row = await tx.reservation.findUniqueOrThrow({
                where: { id: reservation.id },
                select: { id: true, status: true, updatedAt: true },
            });

            const artwork = reservation.artwork
                ? reservation.artwork
                : await tx.artwork.create({
                      data: {
                          reservationId: reservation.id,
                          title: reservation.programTitle,
                          status: ArtworkStatus.RESERVED,
                      },
                      select: { id: true, status: true },
                  });

            if (!reservation.artwork) {
                await tx.artworkLog.create({
                    data: {
                        artworkId: artwork.id,
                        changedBy: reservation.partnerUserId,
                        fromStatus: null,
                        toStatus: ArtworkStatus.RESERVED,
                    },
                });
            }

            await tx.qrToken.upsert({
                where: { artworkId: artwork.id },
                update: {},
                create: { artworkId: artwork.id, token: this.createQrToken(artwork.id) },
            });

            return { reservation: row, artwork };
        });
    }

    async reject(
        reservation: PartnerReservationActionRow,
        userId: string,
        rejectReason: string | null,
    ): Promise<RejectReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            await lockStore(tx, reservation.storeId);
            await assertReservationStatusTransition(tx, reservation.id, reservation.status, {
                status: ReservationStatus.CANCELED,
                canceledBy: userId,
                cancelReason: rejectReason,
                canceledAt: new Date(),
            });

            const row = await tx.reservation.findUniqueOrThrow({
                where: { id: reservation.id },
                select: { id: true, status: true, updatedAt: true },
            });

            await decrementReservedCount(
                tx,
                reservation.storeTimeSlotId,
                reservation.participantCount,
            );

            return row;
        });
    }

    async cancel(
        reservation: PartnerReservationActionRow,
        userId: string,
        cancelReason: string,
    ): Promise<CancelReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            await lockStore(tx, reservation.storeId);
            await assertReservationStatusTransition(tx, reservation.id, reservation.status, {
                status: ReservationStatus.CANCELED,
                canceledBy: userId,
                cancelReason,
                canceledAt: new Date(),
            });

            const row = await tx.reservation.findUniqueOrThrow({
                where: { id: reservation.id },
                select: {
                    id: true,
                    status: true,
                    canceledBy: true,
                    cancelReason: true,
                    canceledAt: true,
                },
            });

            if (reservation.artwork) {
                await tx.artwork.update({
                    where: { id: reservation.artwork.id },
                    data: { status: ArtworkStatus.CANCELED },
                });
            }

            await decrementReservedCount(
                tx,
                reservation.storeTimeSlotId,
                reservation.participantCount,
            );

            return row;
        });
    }

    async complete(reservation: PartnerReservationActionRow): Promise<CompleteReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            await assertReservationStatusTransition(tx, reservation.id, reservation.status, {
                status: ReservationStatus.IN_PROGRESS,
            });

            const row = await tx.reservation.findUniqueOrThrow({
                where: { id: reservation.id },
                select: { id: true, status: true, updatedAt: true },
            });

            // 체험완료 = 제작 시작(건조). 작품 상태를 바로 DRYING 으로 두어
            // statusView 가 IN_PROGRESS(제작 중) 그룹·건조 단계로 노출한다.
            // 기존 작품 있으면 update, 없으면 create — 둘 중 1회 write.
            const existing = reservation.artwork;
            const artwork = existing
                ? await tx.artwork.update({
                      where: { id: existing.id },
                      data: { status: ArtworkStatus.DRYING },
                      select: { id: true, status: true },
                  })
                : await tx.artwork.create({
                      data: {
                          reservationId: reservation.id,
                          title: reservation.programTitle,
                          status: ArtworkStatus.DRYING,
                      },
                      select: { id: true, status: true },
                  });

            if (!existing || existing.status !== ArtworkStatus.DRYING) {
                await tx.artworkLog.create({
                    data: {
                        artworkId: artwork.id,
                        changedBy: reservation.partnerUserId,
                        fromStatus: existing?.status ?? null,
                        toStatus: ArtworkStatus.DRYING,
                    },
                });
            }

            return { reservation: row, artwork };
        });
    }

    async updateInternalMemo(
        reservationId: string,
        memo: string | null,
    ): Promise<{ id: string; internalMemo: string | null }> {
        return this.prisma.reservation.update({
            where: { id: reservationId },
            data: { internalMemo: memo },
            select: { id: true, internalMemo: true },
        });
    }

    private createQrToken(artworkId: string): string {
        return `artwork:${artworkId}:${randomUUID()}`;
    }
}
