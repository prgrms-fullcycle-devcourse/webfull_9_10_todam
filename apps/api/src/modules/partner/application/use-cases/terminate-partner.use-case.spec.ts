import { HttpStatus } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { PartnerTerminationRepository } from '../../domain/repositories/partner-termination.repository';
import { TerminatePartnerUseCase } from './terminate-partner.use-case';

function makeNotificationService(): jest.Mocked<Pick<NotificationService, 'createAndDispatch'>> {
    return { createAndDispatch: jest.fn().mockResolvedValue(undefined) };
}

const TERMINATED_RESULT = {
    outcome: 'TERMINATED' as const,
    partnerId: 'partner-1',
    terminatedAt: new Date('2026-06-08T00:00:00.000Z'),
};

describe('TerminatePartnerUseCase', () => {
    it('returns null after successful termination', async () => {
        const repository = {
            terminate: jest.fn().mockResolvedValue(TERMINATED_RESULT),
        } as unknown as PartnerTerminationRepository;
        const ns = makeNotificationService();

        await expect(
            new TerminatePartnerUseCase(repository, ns as unknown as NotificationService).execute(
                'user-1',
            ),
        ).resolves.toBeNull();
    });

    it('rejects when active work exists', async () => {
        const repository = {
            terminate: jest.fn().mockResolvedValue({
                outcome: 'BLOCKED',
                partnerId: 'partner-1',
                reason: 'RESERVATION',
            }),
        } as unknown as PartnerTerminationRepository;
        const ns = makeNotificationService();

        const error = await new TerminatePartnerUseCase(
            repository,
            ns as unknown as NotificationService,
        )
            .execute('user-1')
            .catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(BusinessException);
        expect(error).toMatchObject({ errorCode: 'ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST' });
        expect((error as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns PARTNER_NOT_FOUND for non-approved partners', async () => {
        const repository = {
            terminate: jest.fn().mockResolvedValue({ outcome: 'NOT_FOUND' }),
        } as unknown as PartnerTerminationRepository;
        const ns = makeNotificationService();

        const error = await new TerminatePartnerUseCase(
            repository,
            ns as unknown as NotificationService,
        )
            .execute('user-1')
            .catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(BusinessException);
        expect(error).toMatchObject({ errorCode: 'PARTNER_NOT_FOUND' });
        expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    // ── P-9 알림 배선 ──

    describe('P-9 — 파트너 해지 시 OPERATION 알림', () => {
        it('TERMINATED 시 createAndDispatch가 P-9 eventType으로 호출된다', async () => {
            const repository = {
                terminate: jest.fn().mockResolvedValue(TERMINATED_RESULT),
            } as unknown as PartnerTerminationRepository;
            const ns = makeNotificationService();

            await new TerminatePartnerUseCase(
                repository,
                ns as unknown as NotificationService,
            ).execute('user-1');

            expect(ns.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: 'user-1',
                    eventType: 'P-9',
                    category: NotificationCategory.OPERATION,
                    idempotencyKey: 'P-9:partner-1:user-1',
                }),
            );
        });

        it('createAndDispatch 실패(삼킴)해도 null이 반환된다', async () => {
            const repository = {
                terminate: jest.fn().mockResolvedValue(TERMINATED_RESULT),
            } as unknown as PartnerTerminationRepository;
            const ns = makeNotificationService();
            ns.createAndDispatch.mockResolvedValue(undefined);

            await expect(
                new TerminatePartnerUseCase(
                    repository,
                    ns as unknown as NotificationService,
                ).execute('user-1'),
            ).resolves.toBeNull();
        });
    });
});
