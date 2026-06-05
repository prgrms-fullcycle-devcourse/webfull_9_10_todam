import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TokenService } from '../token.service';
import { LoginUseCase } from './login.use-case';

// 포트/협력자 mock — Prisma·JWT 실물 없이 use-case 분기만 검증.
function makeUsers(user: User | null): UserRepository {
    return { findByEmail: jest.fn().mockResolvedValue(user) } as unknown as UserRepository;
}

function makeTokenService(): jest.Mocked<
    Pick<TokenService, 'signAccessToken' | 'issueRefreshToken'>
> {
    return {
        signAccessToken: jest.fn().mockReturnValue('access.jwt'),
        issueRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
}

const res = {} as Response;
const now = new Date('2026-06-05T00:00:00.000Z');

function makeUser(overrides: Partial<User> & { passwordHash: string | null }): User {
    return new User(
        'u1',
        'a@b.com',
        '닉',
        overrides.passwordHash,
        overrides.isPartner ?? false,
        true,
        overrides.status ?? 'ACTIVE',
        now,
        now,
    );
}

describe('LoginUseCase', () => {
    it('가입되지 않은 이메일이면 401', async () => {
        const tokenService = makeTokenService();
        const useCase = new LoginUseCase(makeUsers(null), tokenService as unknown as TokenService);
        await expect(useCase.execute({ email: 'x@y.com', password: 'pw' }, res)).rejects.toThrow(
            UnauthorizedException,
        );
        expect(tokenService.issueRefreshToken).not.toHaveBeenCalled();
    });

    it('소셜 전용 계정(passwordHash null)이면 401', async () => {
        const tokenService = makeTokenService();
        const useCase = new LoginUseCase(
            makeUsers(makeUser({ passwordHash: null })),
            tokenService as unknown as TokenService,
        );
        await expect(useCase.execute({ email: 'a@b.com', password: 'pw' }, res)).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it('탈퇴 계정이면 401', async () => {
        const hash = await bcrypt.hash('pw', 10);
        const tokenService = makeTokenService();
        const useCase = new LoginUseCase(
            makeUsers(makeUser({ passwordHash: hash, status: 'WITHDRAWN' })),
            tokenService as unknown as TokenService,
        );
        await expect(useCase.execute({ email: 'a@b.com', password: 'pw' }, res)).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it('비밀번호가 틀리면 401', async () => {
        const hash = await bcrypt.hash('correct', 10);
        const tokenService = makeTokenService();
        const useCase = new LoginUseCase(
            makeUsers(makeUser({ passwordHash: hash })),
            tokenService as unknown as TokenService,
        );
        await expect(useCase.execute({ email: 'a@b.com', password: 'wrong' }, res)).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it('정상 로그인 시 accessToken 발급 + refresh 쿠키 발급', async () => {
        const hash = await bcrypt.hash('pw', 10);
        const tokenService = makeTokenService();
        const useCase = new LoginUseCase(
            makeUsers(makeUser({ passwordHash: hash, isPartner: true })),
            tokenService as unknown as TokenService,
        );

        const result = await useCase.execute({ email: 'a@b.com', password: 'pw' }, res);

        expect(result.accessToken).toBe('access.jwt');
        expect(result.user).toEqual({
            userId: 'u1',
            email: 'a@b.com',
            nickname: '닉',
            isPartner: true,
        });
        expect(tokenService.issueRefreshToken).toHaveBeenCalledWith('u1', res);
    });
});
