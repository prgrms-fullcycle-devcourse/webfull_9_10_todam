import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
    StoreStatus,
    StoreTimeSlotStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    CreateCustomerReservationInput,
    CreateCustomerReservationResult,
    UserReservationRepository,
} from '../../domain/repositories/user-reservation.repository';

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
            const updateResult = await tx.storeTimeSlot.updateMany({
                where: {
                    id: input.slotId,
                    status: StoreTimeSlotStatus.OPEN,
                    reservedCount: { lte: maxCapacity - input.participantCount },
                },
                data: { reservedCount: { increment: input.participantCount } },
            });

            if (updateResult.count === 0) {
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

                await tx.qrToken.create({
                    data: { artworkId: artwork.id, token: this.createQrToken(artwork.id) },
                });
            }

            return { reservation };
        });
    }

    private createQrToken(artworkId: string): string {
        return `artwork:${artworkId}:${randomUUID()}`;
    }
}
