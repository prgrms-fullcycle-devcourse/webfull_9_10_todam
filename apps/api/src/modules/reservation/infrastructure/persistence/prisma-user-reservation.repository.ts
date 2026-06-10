import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    Prisma,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
    StoreStatus,
    StoreTimeSlotStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    CancelUserReservationResult,
    CreateCustomerReservationInput,
    CreateCustomerReservationResult,
    UpsertDeliveryInput,
    UpsertDeliveryResult,
    UserReservationCancelRow,
    UserReservationDeliveryGuardRow,
    UserReservationDetailRow,
    UserReservationListQuery,
    UserReservationListRow,
    UserReservationRepository,
} from '../../domain/repositories/user-reservation.repository';
import {
    assertReservationStatusTransition,
    decrementReservedCount,
    tryIncrementReservedCount,
} from './reservation-slot-count';

@Injectable()
export class PrismaUserReservationRepository extends UserReservationRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async createCustomer(
        userId: string,
        input: CreateCustomerReservationInput,
    ): Promise<CreateCustomerReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            // 1. program 조회 (status=ACTIVE, store 조인)
            const program = await tx.program.findFirst({
                where: { id: input.programId, status: 'ACTIVE' },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    leadTimeDays: true,
                    deliverable: true,
                    storeId: true,
                    store: {
                        select: {
                            status: true,
                            maxCapacityPerSlot: true,
                            autoConfirm: true,
                            partner: { select: { userId: true } },
                        },
                    },
                },
            });

            if (!program) {
                throw new BusinessException(
                    'PROGRAM_NOT_FOUND',
                    '프로그램을 찾을 수 없습니다.',
                    HttpStatus.NOT_FOUND,
                );
            }

            // 1-1. 공방 PUBLISHED 검증 — 미게시 공방은 노출하지 않음(미존재 취급).
            if (program.store.status !== StoreStatus.PUBLISHED) {
                throw new BusinessException(
                    'PROGRAM_NOT_FOUND',
                    '프로그램을 찾을 수 없습니다.',
                    HttpStatus.NOT_FOUND,
                );
            }

            // 2. 자기거래 차단
            if (program.store.partner.userId === userId) {
                throw new BusinessException(
                    'SELF_RESERVATION_NOT_ALLOWED',
                    '본인의 공방은 예약할 수 없습니다.',
                    HttpStatus.FORBIDDEN,
                );
            }

            const storeId = program.storeId;

            // 3. slot 조회 (storeId 일치 확인)
            const slot = await tx.storeTimeSlot.findFirst({
                where: { id: input.slotId, storeId },
                select: { id: true, startAt: true, status: true, reservedCount: true },
            });

            if (!slot) {
                throw new BusinessException(
                    'RESOURCE_NOT_FOUND',
                    '슬롯을 찾을 수 없습니다.',
                    HttpStatus.NOT_FOUND,
                );
            }

            if (slot.status !== StoreTimeSlotStatus.OPEN) {
                throw new BusinessException(
                    'SLOT_BLOCKED',
                    '해당 시간대는 예약할 수 없습니다.',
                    HttpStatus.CONFLICT,
                );
            }

            // 4. ReservationRestriction 확인 (storeId, startAt=slot.startAt, programId)
            const restriction = await tx.reservationRestriction.findFirst({
                where: {
                    storeId,
                    startAt: slot.startAt,
                    programId: program.id,
                },
                select: { id: true },
            });

            if (restriction) {
                throw new BusinessException(
                    'SLOT_BLOCKED',
                    '해당 시간대는 예약이 차단되어 있습니다.',
                    HttpStatus.CONFLICT,
                );
            }

            // 5. 정원 확인: maxCapacityPerSlot null이면 예약 불가
            const maxCapacity = program.store.maxCapacityPerSlot;
            if (maxCapacity === null) {
                throw new BusinessException(
                    'INSUFFICIENT_CAPACITY',
                    '해당 슬롯은 예약 정원이 설정되어 있지 않습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }

            // 6. ProgramSnapshot 생성
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

            const autoConfirm = program.store.autoConfirm;
            const initialStatus = autoConfirm
                ? ReservationStatus.CONFIRMED
                : ReservationStatus.PENDING;

            // 7. 조건부 원자 increment (동시성 안전)
            const incremented = await tryIncrementReservedCount(
                tx,
                input.slotId,
                input.participantCount,
                maxCapacity,
            );

            if (!incremented) {
                throw new BusinessException(
                    'INSUFFICIENT_CAPACITY',
                    '잔여 정원이 부족합니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }

            // 8. Reservation 생성
            const reservation = await tx.reservation.create({
                data: {
                    userId,
                    programId: program.id,
                    storeId,
                    storeTimeSlotId: slot.id,
                    programSnapshotId: snapshot.id,
                    scheduledAt: slot.startAt,
                    reserverName: input.reserverName,
                    reserverPhone: input.reserverPhone,
                    participantCount: input.participantCount,
                    deliveryMethod,
                    status: initialStatus,
                    source: ReservationSource.CUSTOMER,
                    requestMemo: input.requestMemo ?? null,
                },
                select: {
                    id: true,
                    programId: true,
                    storeTimeSlotId: true,
                    reserverName: true,
                    participantCount: true,
                    status: true,
                    createdAt: true,
                },
            });

            // 9. autoConfirm(=CONFIRMED)일 때만 Artwork + QrToken 생성
            if (autoConfirm) {
                const artwork = await tx.artwork.create({
                    data: {
                        reservationId: reservation.id,
                        title: program.title,
                        status: ArtworkStatus.RESERVED,
                    },
                    select: { id: true },
                });

                await tx.artworkLog.create({
                    data: {
                        artworkId: artwork.id,
                        changedBy: program.store.partner.userId,
                        fromStatus: null,
                        toStatus: ArtworkStatus.RESERVED,
                    },
                });

                await tx.qrToken.create({
                    data: { artworkId: artwork.id, token: this.createQrToken(artwork.id) },
                });
            }

            return { reservation };
        });
    }

    async findMyList(
        userId: string,
        query: UserReservationListQuery,
    ): Promise<UserReservationListRow[]> {
        const where: Prisma.ReservationWhereInput = {
            userId,
            ...(query.status ? { status: query.status } : {}),
        };

        const rows = await this.prisma.reservation.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            cursor: query.cursor ? { id: query.cursor } : undefined,
            skip: query.cursor ? 1 : 0,
            take: query.limit + 1,
            select: {
                id: true,
                scheduledAt: true,
                participantCount: true,
                status: true,
                createdAt: true,
                store: { select: { name: true } },
                program: { select: { title: true } },
                artwork: { select: { status: true } },
            },
        });

        return rows.map((row) => ({
            id: row.id,
            storeName: row.store.name,
            programTitle: row.program.title,
            scheduledAt: row.scheduledAt,
            participantCount: row.participantCount,
            status: row.status,
            artworkStatus: row.artwork?.status ?? null,
            createdAt: row.createdAt,
        }));
    }

    async findDetail(reservationId: string): Promise<UserReservationDetailRow | null> {
        const row = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            select: {
                id: true,
                userId: true,
                storeId: true,
                programId: true,
                scheduledAt: true,
                reserverName: true,
                reserverPhone: true,
                participantCount: true,
                deliveryMethod: true,
                status: true,
                source: true,
                requestMemo: true,
                createdAt: true,
                store: {
                    select: {
                        name: true,
                        cancelDeadlineDays: true,
                    },
                },
                program: {
                    select: { title: true },
                },
                programSnapshot: {
                    select: { price: true },
                },
                artwork: {
                    select: { id: true, status: true },
                },
                delivery: {
                    select: {
                        recipientName: true,
                        recipientPhone: true,
                        shippingAddress: true,
                        addressDetail: true,
                        carrier: true,
                        trackingNumber: true,
                    },
                },
                review: {
                    select: { id: true },
                },
            },
        });

        if (!row) return null;

        return {
            id: row.id,
            userId: row.userId,
            storeId: row.storeId,
            storeName: row.store.name,
            cancelDeadlineDays: row.store.cancelDeadlineDays,
            programId: row.programId,
            programTitle: row.program.title,
            programSnapshotPrice: row.programSnapshot.price,
            scheduledAt: row.scheduledAt,
            reserverName: row.reserverName,
            reserverPhone: row.reserverPhone,
            participantCount: row.participantCount,
            deliveryMethod: row.deliveryMethod,
            shippingAddress: row.delivery?.shippingAddress ?? null,
            requestMemo: row.requestMemo,
            status: row.status,
            source: row.source,
            artworkId: row.artwork?.id ?? null,
            artworkStatus: row.artwork?.status ?? null,
            createdAt: row.createdAt,
            delivery: row.delivery
                ? {
                      recipientName: row.delivery.recipientName,
                      recipientPhone: row.delivery.recipientPhone,
                      shippingAddress: row.delivery.shippingAddress,
                      addressDetail: row.delivery.addressDetail,
                      carrier: row.delivery.carrier,
                      trackingNumber: row.delivery.trackingNumber,
                  }
                : null,
            review: row.review ? { id: row.review.id } : null,
        };
    }

    async findForCancel(reservationId: string): Promise<UserReservationCancelRow | null> {
        const row = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            select: {
                id: true,
                userId: true,
                status: true,
                source: true,
                scheduledAt: true,
                participantCount: true,
                storeTimeSlotId: true,
                store: { select: { cancelDeadlineDays: true } },
                artwork: { select: { id: true, status: true } },
            },
        });

        if (!row) return null;

        return {
            id: row.id,
            userId: row.userId,
            status: row.status,
            source: row.source,
            scheduledAt: row.scheduledAt,
            participantCount: row.participantCount,
            storeTimeSlotId: row.storeTimeSlotId,
            cancelDeadlineDays: row.store.cancelDeadlineDays,
            artworkId: row.artwork?.id ?? null,
            artworkStatus: row.artwork?.status ?? null,
        };
    }

    async cancelReservation(
        row: UserReservationCancelRow,
        userId: string,
    ): Promise<CancelUserReservationResult> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Reservation 상태 전이 — 기대 상태일 때만 갱신(동시 취소 시 1건만 성공)
            await assertReservationStatusTransition(tx, row.id, row.status, {
                status: ReservationStatus.CANCELED,
                canceledBy: userId,
                cancelReason: null,
                canceledAt: new Date(),
            });

            const updated = await tx.reservation.findUniqueOrThrow({
                where: { id: row.id },
                select: {
                    id: true,
                    canceledBy: true,
                    cancelReason: true,
                    canceledAt: true,
                },
            });

            // 2. StoreTimeSlot.reservedCount decrement (floor 0, 동시성 안전)
            await decrementReservedCount(tx, row.storeTimeSlotId, row.participantCount);

            // 3 & 4. Artwork 존재 시 CANCELED 전이 + ArtworkLog 기록
            // plan §Risks: 트랜잭션 내 artwork.findUnique → artwork.update → artworkLog.create 순서.
            // fromStatus를 트랜잭션 밖 stale 값이 아닌, 트랜잭션 내 재조회 값으로 사용.
            if (row.artworkId) {
                const currentArtwork = await tx.artwork.findUnique({
                    where: { id: row.artworkId },
                    select: { status: true },
                });

                // 이미 CANCELED이면 update/log 스킵 (幂等 보장)
                if (currentArtwork && currentArtwork.status !== ArtworkStatus.CANCELED) {
                    await tx.artwork.update({
                        where: { id: row.artworkId },
                        data: { status: ArtworkStatus.CANCELED },
                    });

                    await tx.artworkLog.create({
                        data: {
                            artworkId: row.artworkId,
                            changedBy: userId,
                            fromStatus: currentArtwork.status, // 트랜잭션 내 재조회 값
                            toStatus: ArtworkStatus.CANCELED,
                            memo: null,
                        },
                    });
                }
            }

            return {
                id: updated.id,
                status: 'CANCELED' as const,
                canceledBy: updated.canceledBy,
                cancelReason: updated.cancelReason,
                canceledAt: updated.canceledAt,
            };
        });
    }

    async findReservationForDelivery(
        reservationId: string,
    ): Promise<UserReservationDeliveryGuardRow | null> {
        const row = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            select: {
                userId: true,
                deliveryMethod: true,
                status: true,
            },
        });

        if (!row) return null;

        return {
            userId: row.userId,
            deliveryMethod: row.deliveryMethod,
            status: row.status,
        };
    }

    async upsertDelivery(
        reservationId: string,
        input: UpsertDeliveryInput,
    ): Promise<UpsertDeliveryResult> {
        const saved = await this.prisma.delivery.upsert({
            where: { reservationId },
            create: {
                reservationId,
                recipientName: input.recipientName,
                recipientPhone: input.recipientPhone,
                postalCode: input.postalCode,
                shippingAddress: input.address,
                addressDetail: input.addressDetail ?? null,
            },
            update: {
                recipientName: input.recipientName,
                recipientPhone: input.recipientPhone,
                postalCode: input.postalCode,
                shippingAddress: input.address,
                addressDetail: input.addressDetail ?? null,
            },
            select: {
                recipientName: true,
                recipientPhone: true,
                postalCode: true,
                shippingAddress: true,
                addressDetail: true,
            },
        });

        return {
            recipientName: saved.recipientName as string,
            recipientPhone: saved.recipientPhone as string,
            postalCode: saved.postalCode as string,
            address: saved.shippingAddress as string,
            ...(saved.addressDetail != null ? { addressDetail: saved.addressDetail } : {}),
        };
    }

    private createQrToken(artworkId: string): string {
        return `artwork:${artworkId}:${randomUUID()}`;
    }
}
