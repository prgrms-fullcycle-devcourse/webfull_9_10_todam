import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../../../database/prisma.service';
import { JwtAdminStrategy } from './jwt-admin.strategy';

describe('JwtAdminStrategy', () => {
    process.env['JWT_ADMIN_SECRET'] = 'test-admin-secret';
    const findUnique = jest.fn();
    const strategy = new JwtAdminStrategy({
        admin: { findUnique },
    } as unknown as PrismaService);

    beforeEach(() => jest.clearAllMocks());

    it('rejects a non-admin token payload', async () => {
        await expect(strategy.validate({ sub: 'user-id', type: 'user' as never })).rejects.toThrow(
            UnauthorizedException,
        );
        expect(findUnique).not.toHaveBeenCalled();
    });

    it('rejects a deleted admin account', async () => {
        findUnique.mockResolvedValue(null);

        await expect(strategy.validate({ sub: 'admin-id', type: 'admin' })).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it('accepts an existing admin account', async () => {
        findUnique.mockResolvedValue({ id: 'admin-id' });

        await expect(strategy.validate({ sub: 'admin-id', type: 'admin' })).resolves.toEqual({
            id: 'admin-id',
            type: 'admin',
        });
    });
});
