import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerTerminationRepository } from '../../domain/repositories/partner-termination.repository';
import { TerminatePartnerUseCase } from './terminate-partner.use-case';

describe('TerminatePartnerUseCase', () => {
    it('returns null after successful termination', async () => {
        const repository = {
            terminate: jest.fn().mockResolvedValue({
                outcome: 'TERMINATED',
                partnerId: 'partner-1',
                terminatedAt: new Date('2026-06-08T00:00:00.000Z'),
            }),
        } as unknown as PartnerTerminationRepository;

        await expect(new TerminatePartnerUseCase(repository).execute('user-1')).resolves.toBeNull();
    });

    it('rejects when active work exists', async () => {
        const repository = {
            terminate: jest.fn().mockResolvedValue({
                outcome: 'BLOCKED',
                partnerId: 'partner-1',
                reason: 'RESERVATION',
            }),
        } as unknown as PartnerTerminationRepository;

        const error = await new TerminatePartnerUseCase(repository)
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

        const error = await new TerminatePartnerUseCase(repository)
            .execute('user-1')
            .catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(BusinessException);
        expect(error).toMatchObject({ errorCode: 'PARTNER_NOT_FOUND' });
        expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
});
