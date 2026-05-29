import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { EmailService } from '../../infrastructure/email/email.service';

const CODE_TTL_SECONDS = 300;       // 인증코드 유효 시간: 5분
const RESEND_COOLDOWN_SECONDS = 60; // 재전송 쿨다운: 1분

function generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class SendEmailCodeUseCase {
    constructor(
        private readonly redis: RedisService,
        private readonly emailService: EmailService,
    ) {}

    async execute(email: string): Promise<void> {
        const key = `email:verify:${email}`;

        // 쿨다운 체크: 발송 후 1분 이내 재요청 차단
        const remainingTtl = await this.redis.ttl(key);
        if (remainingTtl > CODE_TTL_SECONDS - RESEND_COOLDOWN_SECONDS) {
            throw new BadRequestException('잠시 후 다시 시도해주세요. (1분 후 재전송 가능)');
        }

        const code = generateSixDigitCode();
        await this.redis.set(key, code, CODE_TTL_SECONDS);
        await this.emailService.sendVerificationCode(email, code);
    }
}
