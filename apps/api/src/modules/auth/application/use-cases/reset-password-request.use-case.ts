import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { EmailService } from '../../infrastructure/email/email.service';

const RESET_CODE_TTL_SECONDS = 1800; // 30분

function generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class ResetPasswordRequestUseCase {
    constructor(
        private readonly users: UserRepository,
        private readonly redis: RedisService,
        private readonly emailService: EmailService,
    ) {}

    async execute(email: string): Promise<void> {
        const user = await this.users.findByEmail(email);

        // 가입되지 않은 이메일이거나 소셜 전용 계정이면 조용히 종료
        // (이메일 존재 여부를 응답으로 노출하지 않음 - 이메일 열거 공격 방지)
        if (!user || !user.passwordHash) return;

        const code = generateCode();
        await this.redis.set(`password:reset:${email}`, code, RESET_CODE_TTL_SECONDS);
        await this.emailService.sendPasswordResetLink(email, code);
    }
}
