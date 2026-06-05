import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../../../redis/redis.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import type { ResetPasswordDto } from '../../presentation/dto/reset-password.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        private readonly users: UserRepository,
        private readonly redis: RedisService,
    ) {}

    async execute(dto: ResetPasswordDto): Promise<void> {
        const { email, code, newPassword } = dto;

        const stored = await this.redis.get(`password:reset:${email}`);
        if (!stored || stored !== code) {
            throw new BadRequestException('유효하지 않거나 만료된 인증코드입니다.');
        }

        const user = await this.users.findByEmail(email);
        if (!user) {
            throw new BadRequestException('유효하지 않거나 만료된 인증코드입니다.');
        }

        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // 비밀번호 변경 + 기존 refresh token 전체 폐기(세션 무효화)를 한 트랜잭션으로
        await this.users.updatePasswordAndRevokeTokens(user.id, passwordHash);

        await this.redis.del(`password:reset:${email}`);
    }
}
