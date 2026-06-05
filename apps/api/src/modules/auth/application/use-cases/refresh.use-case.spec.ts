import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService } from '../token.service';
import { RefreshUseCase } from './refresh.use-case';

function makeRepo(
    overrides: Partial<jest.Mocked<RefreshTokenRepository>>,
): jest.Mocked<RefreshTokenRepository> {
    return {
        create: jest.fn(),
        findById: jest.fn(),
        deleteById: jest.fn().mockResolvedValue(undefined),
        deleteByUserId: jest.fn().mockResolvedValue(undefined),
        deleteByIdAndUser: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    } as jest.Mocked<RefreshTokenRepository>;
}

function makeTokenService(): jest.Mocked<
    Pick<TokenService, 'signAccessToken' | 'issueRefreshToken'>
> {
    return {
        signAccessToken: jest.fn().mockReturnValue('new.access.jwt'),
        issueRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
}

const res = {} as Response;
const FAR_FUTURE = new Date('2999-01-01T00:00:00.000Z');
const PAST = new Date('2000-01-01T00:00:00.000Z');

describe('RefreshUseCase', () => {
    it('쿠키가 없으면 401', async () => {
        const useCase = new RefreshUseCase(
            makeRepo({}),
            makeTokenService() as unknown as TokenService,
        );
        await expect(useCase.execute(undefined, res)).rejects.toThrow(UnauthorizedException);
    });

    it('구분자(.)가 없는 쿠키면 401', async () => {
        const useCase = new RefreshUseCase(
            makeRepo({}),
            makeTokenService() as unknown as TokenService,
        );
        await expect(useCase.execute('nodot', res)).rejects.toThrow(UnauthorizedException);
    });

    it('저장된 토큰이 없으면 401', async () => {
        const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
        const useCase = new RefreshUseCase(repo, makeTokenService() as unknown as TokenService);
        await expect(useCase.execute('id1.raw', res)).rejects.toThrow(UnauthorizedException);
    });

    it('만료된 토큰이면 삭제 후 401', async () => {
        const repo = makeRepo({
            findById: jest.fn().mockResolvedValue(new RefreshToken('id1', 'u1', 'hash', PAST)),
        });
        const useCase = new RefreshUseCase(repo, makeTokenService() as unknown as TokenService);
        await expect(useCase.execute('id1.raw', res)).rejects.toThrow(UnauthorizedException);
        expect(repo.deleteById).toHaveBeenCalledWith('id1');
    });

    it('해시 불일치(도용 의심)면 유저 토큰 전체 삭제 후 401', async () => {
        const hash = await bcrypt.hash('realtoken', 10);
        const repo = makeRepo({
            findById: jest.fn().mockResolvedValue(new RefreshToken('id1', 'u1', hash, FAR_FUTURE)),
        });
        const useCase = new RefreshUseCase(repo, makeTokenService() as unknown as TokenService);
        await expect(useCase.execute('id1.wrongtoken', res)).rejects.toThrow(UnauthorizedException);
        expect(repo.deleteByUserId).toHaveBeenCalledWith('u1');
    });

    it('유효한 토큰이면 rotation(기존 삭제) + 새 accessToken 발급', async () => {
        const raw = 'realtoken';
        const hash = await bcrypt.hash(raw, 10);
        const repo = makeRepo({
            findById: jest.fn().mockResolvedValue(new RefreshToken('id1', 'u1', hash, FAR_FUTURE)),
        });
        const tokenService = makeTokenService();
        const useCase = new RefreshUseCase(repo, tokenService as unknown as TokenService);

        const result = await useCase.execute(`id1.${raw}`, res);

        expect(result).toEqual({ accessToken: 'new.access.jwt' });
        expect(repo.deleteById).toHaveBeenCalledWith('id1');
        expect(tokenService.issueRefreshToken).toHaveBeenCalledWith('u1', res);
    });
});
