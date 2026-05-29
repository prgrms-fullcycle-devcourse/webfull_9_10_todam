import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../database/prisma.service';
import { RedisService } from '../../../../redis/redis.service';
import { EmailService } from '../../infrastructure/email/email.service';

const RESET_TOKEN_TTL_SECONDS = 900; // 15분

@Injectable()
export class ResetPasswordRequestUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly emailService: EmailService,
    ) {}

    async execute(email: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true },
        });

        // 가입되지 않은 이메일이거나 소셜 전용 계정이면 조용히 종료
        // (이메일 존재 여부를 응답으로 노출하지 않음 - 이메일 열거 공격 방지)
        if (!user || !user.password) return;

        const token = randomUUID();
        await this.redis.set(`password:reset:${email}`, token, RESET_TOKEN_TTL_SECONDS);
        await this.emailService.sendPasswordResetToken(email, token);
    }
}
