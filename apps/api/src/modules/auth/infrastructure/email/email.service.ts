import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    async sendVerificationCode(email: string, code: string): Promise<void> {
        // TODO: AWS SES 연동 예정 (최태성)
        console.log(`[이메일 인증] ${email} → 인증코드: ${code}`);
    }
}
