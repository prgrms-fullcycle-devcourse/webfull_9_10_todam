import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    Prisma,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
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
    RejectReservationResult,
} from '../../domain/repositories/partner-reservation.repository';

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
                program: { select: { title: true } },
            },
        });

        return rows.map((row) => ({ ...row, programTitle: row.program.title }));
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
            const [program, slot] = await Promise.all([
                tx.program.findFirst({
                    where: { id: input.programId, storeId, status: 'ACTIVE' },
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        leadTimeDays: true,
                        deliverable: true,
                    },
                }),
                tx.storeTimeSlot.findFirst({
                    where: { id: input.slotId, storeId },
                    select: { id: true, startAt: true },
                }),
            ]);

            if (!program || !slot) return null;

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

            await tx.storeTimeSlot.update({
                where: { id: slot.id },
                data: { reservedCount: { increment: input.participantCount } },
            });

            const artwork = await tx.artwork.create({
                data: {
                    reservationId: reservation.id,
                    title: program.title,
                    internalMemo: input.internalMemo ?? null,
                    status:
                        input.initialStatus === ReservationStatus.IN_PROGRESS
                            ? ArtworkStatus.VISITED
                            : ArtworkStatus.RESERVED,
                },
                select: { id: true },
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
        };
    }

    async confirm(reservation: PartnerReservationActionRow): Promise<ConfirmReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            const row = await tx.reservation.update({
                where: { id: reservation.id },
                data: { status: ReservationStatus.CONFIRMED },
                select: { id: true, status: true, updatedAt: true },
            });

            const artwork =
                reservation.artwork ??
                (await tx.artwork.create({
                    data: {
                        reservationId: reservation.id,
                        title: reservation.programTitle,
                        status: ArtworkStatus.RESERVED,
                    },
                    select: { id: true, status: true },
                }));

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
            const row = await tx.reservation.update({
                where: { id: reservation.id },
                data: {
                    status: ReservationStatus.CANCELED,
                    canceledBy: userId,
                    cancelReason: rejectReason,
                    canceledAt: new Date(),
                },
                select: { id: true, status: true, updatedAt: true },
            });

            await this.decrementReservedCount(
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
            const row = await tx.reservation.update({
                where: { id: reservation.id },
                data: {
                    status: ReservationStatus.CANCELED,
                    canceledBy: userId,
                    cancelReason,
                    canceledAt: new Date(),
                },
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

            await this.decrementReservedCount(
                tx,
                reservation.storeTimeSlotId,
                reservation.participantCount,
            );

            return row;
        });
    }

    async complete(reservation: PartnerReservationActionRow): Promise<CompleteReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            const row = await tx.reservation.update({
                where: { id: reservation.id },
                data: { status: ReservationStatus.IN_PROGRESS },
                select: { id: true, status: true, updatedAt: true },
            });

            const artwork =
                reservation.artwork ??
                (await tx.artwork.create({
                    data: {
                        reservationId: reservation.id,
                        title: reservation.programTitle,
                        status: ArtworkStatus.VISITED,
                    },
                    select: { id: true, status: true },
                }));

            const artworkRow = await tx.artwork.update({
                where: { id: artwork.id },
                data: { status: ArtworkStatus.VISITED },
                select: { status: true },
            });

            return { reservation: row, artwork: artworkRow };
        });
    }

    private createQrToken(artworkId: string): string {
        return `artwork:${artworkId}:${randomUUID()}`;
    }

    private async decrementReservedCount(
        tx: Prisma.TransactionClient,
        storeTimeSlotId: string,
        amount: number,
    ): Promise<void> {
        const slot = await tx.storeTimeSlot.findUnique({
            where: { id: storeTimeSlotId },
            select: { reservedCount: true },
        });
        if (!slot) return;

        await tx.storeTimeSlot.update({
            where: { id: storeTimeSlotId },
            data: { reservedCount: Math.max(0, slot.reservedCount - amount) },
        });
    }
}
