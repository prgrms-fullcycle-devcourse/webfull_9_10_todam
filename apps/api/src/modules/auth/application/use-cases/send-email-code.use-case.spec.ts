/// <reference types="jest" />
// @todam/config 는 src(TS/ESM)로 해석되어 jest transform 대상 밖이므로, use-case import 전에 모킹.
// (transitive: use-case → EmailService → @todam/config)
jest.mock('@todam/config', () => ({
    createApiEnv: () => ({
        SES_REGION: 'ap-northeast-2',
        SES_FROM_EMAIL: 'no-reply@todam.app',
        FRONTEND_URL: 'http://localhost:3000',
    }),
}));

import { BadRequestException, ConflictException } from '@nestjs/common';
import { SendEmailCodeUseCase } from './send-email-code.use-case';

const EMAIL = 'test@todam.app';

function makeRedis(ttl = -2) {
    return {
        ttl: jest.fn().mockResolvedValue(ttl),
        set: jest.fn().mockResolvedValue(undefined),
    };
}

function makeEmail() {
    return { sendVerificationCode: jest.fn().mockResolvedValue(undefined) };
}

function makeUsers(existing: { id: string } | null) {
    return { findByEmail: jest.fn().mockResolvedValue(existing) };
}

describe('SendEmailCodeUseCase', () => {
    it('이미 가입된 이메일 → ConflictException, 코드 발송 안 함', async () => {
        const redis = makeRedis();
        const email = makeEmail();
        const users = makeUsers({ id: 'user-001' });
        const useCase = new SendEmailCodeUseCase(redis as never, email as never, users as never);

        await expect(useCase.execute(EMAIL)).rejects.toBeInstanceOf(ConflictException);
        expect(email.sendVerificationCode).not.toHaveBeenCalled();
        expect(redis.set).not.toHaveBeenCalled();
    });

    it('신규 이메일 → 코드 Redis 저장 + 인증메일 발송', async () => {
        const redis = makeRedis(-2); // 키 없음
        const email = makeEmail();
        const users = makeUsers(null);
        const useCase = new SendEmailCodeUseCase(redis as never, email as never, users as never);

        await useCase.execute(EMAIL);

        expect(redis.set).toHaveBeenCalledWith(`email:verify:${EMAIL}`, expect.any(String), 300);
        expect(email.sendVerificationCode).toHaveBeenCalledWith(EMAIL, expect.any(String));
    });

    it('쿨다운(1분) 이내 재요청 → BadRequestException', async () => {
        // ttl > 300-60=240 이면 쿨다운 중.
        const redis = makeRedis(250);
        const email = makeEmail();
        const users = makeUsers(null);
        const useCase = new SendEmailCodeUseCase(redis as never, email as never, users as never);

        await expect(useCase.execute(EMAIL)).rejects.toBeInstanceOf(BadRequestException);
        expect(email.sendVerificationCode).not.toHaveBeenCalled();
    });
});
