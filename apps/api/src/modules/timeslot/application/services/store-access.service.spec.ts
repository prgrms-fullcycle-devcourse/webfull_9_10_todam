/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreAccessService } from './store-access.service';

describe('StoreAccessService', () => {
    const findUnique = jest.fn();
    const service = new StoreAccessService({
        store: { findUnique },
    } as never);

    beforeEach(() => {
        findUnique.mockReset();
    });

    it('returns time-slot store config when the user owns the store', async () => {
        findUnique.mockResolvedValue({
            id: 'store-1',
            maxCapacityPerSlot: 4,
            reservationIntervalMinutes: 30,
            partner: { userId: 'user-1' },
        });

        await expect(service.verifyOwnership('user-1', 'store-1')).resolves.toEqual({
            id: 'store-1',
            maxCapacityPerSlot: 4,
            reservationIntervalMinutes: 30,
        });
        expect(findUnique).toHaveBeenCalledWith({
            where: { id: 'store-1' },
            select: {
                id: true,
                maxCapacityPerSlot: true,
                reservationIntervalMinutes: true,
                partner: { select: { userId: true } },
            },
        });
    });

    it('throws RESOURCE_NOT_FOUND when the store does not exist', async () => {
        findUnique.mockResolvedValue(null);

        try {
            await service.verifyOwnership('user-1', 'missing-store');
            throw new Error('Expected verifyOwnership to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('RESOURCE_NOT_FOUND');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        }
    });

    it('throws FORBIDDEN when the user does not own the store', async () => {
        findUnique.mockResolvedValue({
            id: 'store-1',
            maxCapacityPerSlot: null,
            reservationIntervalMinutes: null,
            partner: { userId: 'other-user' },
        });

        try {
            await service.verifyOwnership('user-1', 'store-1');
            throw new Error('Expected verifyOwnership to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('FORBIDDEN');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
        }
    });
});
