import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { PrismaService } from '../../../../database/prisma.service';
import { AdminLoginUseCase } from './admin-login.use-case';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AdminLoginUseCase', () => {
    const findUnique = jest.fn();
    const sign = jest.fn(() => 'admin-token');
    const useCase = new AdminLoginUseCase(
        { admin: { findUnique } } as unknown as PrismaService,
        { sign } as unknown as JwtService,
    );

    beforeEach(() => jest.clearAllMocks());

    it('rejects an unknown email', async () => {
        findUnique.mockResolvedValue(null);
        jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

        await expect(
            useCase.execute({ email: 'missing@example.com', password: 'password' }),
        ).rejects.toThrow(BusinessException);
        expect(bcrypt.compare).toHaveBeenCalledWith('password', expect.stringMatching(/^\$2b\$/));
    });

    it('rejects an invalid password', async () => {
        findUnique.mockResolvedValue({
            id: 'admin-id',
            email: 'admin@example.com',
            password: 'hash',
            name: '관리자',
        });
        jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

        await expect(
            useCase.execute({ email: 'admin@example.com', password: 'wrong' }),
        ).rejects.toThrow(BusinessException);
    });

    it('returns an admin access token for valid credentials', async () => {
        findUnique.mockResolvedValue({
            id: 'admin-id',
            email: 'admin@example.com',
            password: 'hash',
            name: '관리자',
        });
        jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

        await expect(
            useCase.execute({ email: 'admin@example.com', password: 'password' }),
        ).resolves.toEqual({
            admin: { id: 'admin-id', email: 'admin@example.com', name: '관리자' },
            accessToken: 'admin-token',
        });
        expect(sign).toHaveBeenCalledWith({ sub: 'admin-id', type: 'admin' });
    });
});
