/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { NotificationCategory, ReservationStatus } from '@prisma/client';
// dto 입력 타입은 shared(zod) enum 기준 — 컨트롤러 ZodValidationPipe 와 동일 SSOT.
import { ReservationDeliveryMethod } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { CreateUserReservationUseCase } from './create-user-reservation.use-case';

const PARTNER_USER_ID = 'partner-user-001';

function makeNotificationService(): jest.Mocked<Pick<NotificationService, 'createAndDispatch'>> {
    return { createAndDispatch: jest.fn().mockResolvedValue(undefined) };
}

describe('CreateUserReservationUseCase', () => {
    const createCustomer = jest.fn();
    const notificationService = makeNotificationService();

    const useCase = new CreateUserReservationUseCase(
        { createCustomer } as never,
        notificationService as unknown as NotificationService,
    );

    const USER_ID = 'user-001';
    const dto = {
        programId: 'prog-001',
        slotId: 'slot-001',
        reserverName: '김토담',
        reserverPhone: '010-1234-5678',
        participantCount: 2,
        deliveryMethod: ReservationDeliveryMethod.PICKUP,
        requestMemo: '왼손잡이입니다.',
    };

    beforeEach(() => {
        createCustomer.mockReset();
    });

    it('PENDING 예약 생성 성공 시 displayState.label이 "예약신청"이다', async () => {
        createCustomer.mockResolvedValue({
            reservation: {
                id: 'res-001',
                programId: 'prog-001',
                storeTimeSlotId: 'slot-001',
                reserverName: '김토담',
                participantCount: 2,
                status: ReservationStatus.PENDING,
                createdAt: new Date('2026-05-25T19:35:00.000Z'),
            },
            partnerUserId: PARTNER_USER_ID,
        });

        const result = await useCase.execute(USER_ID, dto);

        expect(result.reservation.status).toBe(ReservationStatus.PENDING);
        expect(result.reservation.displayState.label).toBe('예약신청');
        expect(result.reservation.displayState.description).toBe(
            '작가님이 예약 내용을 확인하고 있어요.',
        );
        expect(result.reservation.displayState.subLabel).toBeNull();
        expect(result.reservation.slotId).toBe('slot-001');
        expect(result.reservation.createdAt).toBe('2026-05-25T19:35:00.000Z');
    });

    it('CONFIRMED 예약(autoConfirm 공방) 시 displayState.label이 "예약확정"이다', async () => {
        createCustomer.mockResolvedValue({
            reservation: {
                id: 'res-002',
                programId: 'prog-001',
                storeTimeSlotId: 'slot-001',
                reserverName: '김토담',
                participantCount: 1,
                status: ReservationStatus.CONFIRMED,
                createdAt: new Date('2026-05-25T19:36:00.000Z'),
            },
            partnerUserId: null,
        });

        const result = await useCase.execute(USER_ID, dto);

        expect(result.reservation.status).toBe(ReservationStatus.CONFIRMED);
        expect(result.reservation.displayState.label).toBe('예약확정');
        expect(result.reservation.displayState.description).toBe(
            '예약이 확정되었어요. 공방에서 곧 만나요!',
        );
        expect(result.reservation.displayState.subLabel).toBeNull();
    });

    it('repository가 PROGRAM_NOT_FOUND를 던지면 그대로 전파한다', async () => {
        createCustomer.mockRejectedValue(
            new BusinessException(
                'PROGRAM_NOT_FOUND',
                '프로그램을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            ),
        );

        try {
            await useCase.execute(USER_ID, dto);
            throw new Error('Expected to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('PROGRAM_NOT_FOUND');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        }
    });

    it('repository가 SELF_RESERVATION_NOT_ALLOWED를 던지면 그대로 전파한다', async () => {
        createCustomer.mockRejectedValue(
            new BusinessException(
                'SELF_RESERVATION_NOT_ALLOWED',
                '본인의 공방은 예약할 수 없습니다.',
                HttpStatus.FORBIDDEN,
            ),
        );

        try {
            await useCase.execute(USER_ID, dto);
            throw new Error('Expected to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('SELF_RESERVATION_NOT_ALLOWED');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
        }
    });

    it('repository가 SLOT_BLOCKED를 던지면 그대로 전파한다', async () => {
        createCustomer.mockRejectedValue(
            new BusinessException(
                'SLOT_BLOCKED',
                '해당 시간대는 예약이 차단되어 있습니다.',
                HttpStatus.CONFLICT,
            ),
        );

        try {
            await useCase.execute(USER_ID, dto);
            throw new Error('Expected to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('SLOT_BLOCKED');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
        }
    });

    it('repository가 INSUFFICIENT_CAPACITY를 던지면 그대로 전파한다', async () => {
        createCustomer.mockRejectedValue(
            new BusinessException(
                'INSUFFICIENT_CAPACITY',
                '잔여 정원이 부족합니다.',
                HttpStatus.BAD_REQUEST,
            ),
        );

        try {
            await useCase.execute(USER_ID, dto);
            throw new Error('Expected to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('INSUFFICIENT_CAPACITY');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        }
    });

    it('dto의 필드가 repository에 올바르게 전달된다', async () => {
        createCustomer.mockResolvedValue({
            reservation: {
                id: 'res-003',
                programId: 'prog-001',
                storeTimeSlotId: 'slot-001',
                reserverName: '김토담',
                participantCount: 2,
                status: ReservationStatus.PENDING,
                createdAt: new Date('2026-05-25T19:35:00.000Z'),
            },
            partnerUserId: PARTNER_USER_ID,
        });

        await useCase.execute(USER_ID, dto);

        expect(createCustomer).toHaveBeenCalledWith(USER_ID, {
            programId: dto.programId,
            slotId: dto.slotId,
            reserverName: dto.reserverName,
            reserverPhone: dto.reserverPhone,
            participantCount: dto.participantCount,
            deliveryMethod: dto.deliveryMethod,
            requestMemo: dto.requestMemo,
        });
    });

    // ── P-1 알림 배선 ──
    describe('P-1 — 신규 PENDING 예약 시 파트너 알림', () => {
        it('PENDING 예약 생성 + partnerUserId 있을 때 createAndDispatch가 P-1 eventType으로 호출된다', async () => {
            notificationService.createAndDispatch.mockClear();
            createCustomer.mockResolvedValue({
                reservation: {
                    id: 'res-p1',
                    programId: 'prog-001',
                    storeTimeSlotId: 'slot-001',
                    reserverName: '김토담',
                    participantCount: 2,
                    status: ReservationStatus.PENDING,
                    createdAt: new Date('2026-05-25T19:35:00.000Z'),
                },
                partnerUserId: PARTNER_USER_ID,
            });

            await useCase.execute(USER_ID, dto);

            expect(notificationService.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: PARTNER_USER_ID,
                    eventType: 'P-1',
                    idempotencyKey: `P-1:res-p1:${PARTNER_USER_ID}`,
                }),
            );
        });

        it('CONFIRMED 예약(autoConfirm) 시 고객 U-1 + 파트너 P-4 알림이 모두 발송된다', async () => {
            notificationService.createAndDispatch.mockClear();
            createCustomer.mockResolvedValue({
                reservation: {
                    id: 'res-confirmed',
                    programId: 'prog-001',
                    storeTimeSlotId: 'slot-001',
                    reserverName: '김토담',
                    participantCount: 2,
                    status: ReservationStatus.CONFIRMED,
                    createdAt: new Date('2026-05-25T19:35:00.000Z'),
                },
                partnerUserId: PARTNER_USER_ID,
            });

            await useCase.execute(USER_ID, dto);

            // 고객 U-1 (예약 확정)
            expect(notificationService.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: USER_ID,
                    eventType: 'U-1',
                    category: NotificationCategory.TRANSACTION,
                    body: '예약이 확정되었어요. 공방에서 곧 만나요!',
                    idempotencyKey: `U-1:res-confirmed:${USER_ID}`,
                }),
            );
            // 파트너 P-4 (예약 자동 확정)
            expect(notificationService.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: PARTNER_USER_ID,
                    eventType: 'P-4',
                    category: NotificationCategory.OPERATION,
                    idempotencyKey: `P-4:res-confirmed:${PARTNER_USER_ID}`,
                }),
            );
        });
    });
});
