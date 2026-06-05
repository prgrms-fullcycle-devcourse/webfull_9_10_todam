import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { SignupRequest, SignupResponse } from '@todam/shared';
import { RedisService } from '../../../../redis/redis.service';
import { UserRepository } from '../../domain/repositories/user.repository';

const BCRYPT_ROUNDS = 10;

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

        const user = await this.users.create({
            email: dto.email,
            passwordHash,
            nickname,
            emailVerified: true,
        });

        await this.redis.del(`email:verified:${dto.email}`);

        return { user: { userId: user.id, email: user.email, nickname: user.nickname } };
    }
}
