import { BadRequestException, ConflictException } from '@nestjs/common';
import { PolicyType } from '@todam/shared';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RedisService } from '../../../../redis/redis.service';
import { SignupUseCase } from './signup.use-case';

const now = new Date('2026-06-11T00:00:00.000Z');

function makeUser(): User {
    return new User('u1', 'a@b.com', '도예인', 'hash', false, true, 'ACTIVE', now, now);
}

// 포트/협력자 mock — Prisma·Redis 실물 없이 use-case 분기만 검증.
function makeDeps(opts: { verified?: string | null; existing?: User | null }): {
    users: jest.Mocked<Pick<UserRepository, 'findByEmail' | 'createWithConsents'>>;
    redis: jest.Mocked<Pick<RedisService, 'get' | 'del'>>;
} {
    return {
        users: {
            findByEmail: jest.fn().mockResolvedValue(opts.existing ?? null),
            createWithConsents: jest.fn().mockResolvedValue(makeUser()),
        },
        redis: {
            get: jest.fn().mockResolvedValue('verified' in opts ? opts.verified : 'true'),
            del: jest.fn().mockResolvedValue(undefined),
        },
    };
}

const validDto = {
    email: 'a@b.com',
    password: 'password1234',
    nickname: '도예인',
    termsAgreed: true,
    privacyAgreed: true,
    locationAgreed: true,
};

describe('SignupUseCase', () => {
    it('필수 약관(위치기반)이 false면 400, 유저 생성 안 함', async () => {
        const { users, redis } = makeDeps({});
        const useCase = new SignupUseCase(
            users as unknown as UserRepository,
            redis as unknown as RedisService,
        );

        await expect(useCase.execute({ ...validDto, locationAgreed: false })).rejects.toThrow(
            BadRequestException,
        );
        expect(users.createWithConsents).not.toHaveBeenCalled();
    });

    it('이메일 미인증이면 400', async () => {
        const { users, redis } = makeDeps({ verified: null });
        const useCase = new SignupUseCase(
            users as unknown as UserRepository,
            redis as unknown as RedisService,
        );

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestException);
        expect(users.createWithConsents).not.toHaveBeenCalled();
    });

    it('이미 가입된 이메일이면 409', async () => {
        const { users, redis } = makeDeps({ existing: makeUser() });
        const useCase = new SignupUseCase(
            users as unknown as UserRepository,
            redis as unknown as RedisService,
        );

        await expect(useCase.execute(validDto)).rejects.toThrow(ConflictException);
        expect(users.createWithConsents).not.toHaveBeenCalled();
    });

    it('정상 가입 시 약관 3종으로 createWithConsents 호출 + 인증 키 삭제', async () => {
        const { users, redis } = makeDeps({});
        const useCase = new SignupUseCase(
            users as unknown as UserRepository,
            redis as unknown as RedisService,
        );

        const result = await useCase.execute(validDto);

        expect(result.user).toEqual({ userId: 'u1', email: 'a@b.com', nickname: '도예인' });
        expect(users.createWithConsents).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'a@b.com', nickname: '도예인', emailVerified: true }),
            [
                PolicyType.TERMS_OF_SERVICE,
                PolicyType.PRIVACY_POLICY,
                PolicyType.LOCATION_BASED_SERVICE,
            ],
        );
        expect(redis.del).toHaveBeenCalledWith('email:verified:a@b.com');
    });
});
