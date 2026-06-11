import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PolicyType, type SignupRequest, type SignupResponse } from '@todam/shared';
import { RedisService } from '../../../../redis/redis.service';
import { UserRepository } from '../../domain/repositories/user.repository';

const BCRYPT_ROUNDS = 10;

// 회원가입 시 동의 이력을 남길 필수 약관 3종(모두 필수동의).
const REQUIRED_CONSENT_POLICIES = [
    PolicyType.TERMS_OF_SERVICE,
    PolicyType.PRIVACY_POLICY,
    PolicyType.LOCATION_BASED_SERVICE,
];

function generateRandomNickname(): string {
    return `사용자_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

@Injectable()
export class SignupUseCase {
    constructor(
        private readonly users: UserRepository,
        private readonly redis: RedisService,
    ) {}

    async execute(dto: SignupRequest): Promise<SignupResponse> {
        // ⑥ 필수 약관 동의 방어적 재검증(계약 단계에서 이미 true 강제되나, use-case에서도 보장).
        if (!(dto.termsAgreed && dto.privacyAgreed && dto.locationAgreed)) {
            throw new BadRequestException('필수 약관에 동의해야 합니다.');
        }

        const verified = await this.redis.get(`email:verified:${dto.email}`);
        if (!verified) {
            throw new BadRequestException('이메일 인증이 필요합니다.');
        }

        const existing = await this.users.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('이미 가입된 이메일입니다.');
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const nickname = dto.nickname ?? generateRandomNickname();

        // ⑨ users 생성 + UserConsent(약관 3종) 기록을 한 트랜잭션으로 처리.
        const user = await this.users.createWithConsents(
            {
                email: dto.email,
                passwordHash,
                nickname,
                emailVerified: true,
            },
            REQUIRED_CONSENT_POLICIES,
        );

        await this.redis.del(`email:verified:${dto.email}`);

        return { user: { userId: user.id, email: user.email, nickname: user.nickname } };
    }
}
