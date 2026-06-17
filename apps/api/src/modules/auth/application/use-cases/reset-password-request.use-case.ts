import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
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

        // 비밀번호 로그인 계정이 아니면(미가입·소셜 전용) 가입 이력 없음으로 안내한다.
        // QA-요구(2026-06-17 팀 결정): 미가입/잘못된 계정은 "가입 이력이 없습니다." 노출 —
        // 이메일 열거 방지보다 재설정 UX의 명확성을 우선한다.
        if (!user || !user.passwordHash) {
            throw new BusinessException(
                'ACCOUNT_NOT_FOUND',
                '가입 이력이 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const code = generateCode();
        await this.redis.set(`password:reset:${email}`, code, RESET_CODE_TTL_SECONDS);
        await this.emailService.sendPasswordResetLink(email, code);
    }
}
