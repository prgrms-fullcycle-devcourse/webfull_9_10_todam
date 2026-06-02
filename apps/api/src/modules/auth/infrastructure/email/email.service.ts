import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    async sendVerificationCode(email: string, code: string): Promise<void> {
        // TODO: AWS SES 연동 예정
        console.log(`[이메일 인증] ${email} → 인증코드: ${code}`);
    }

    async sendPasswordResetCode(email: string, code: string): Promise<void> {
        // TODO: AWS SES 연동 예정
        console.log(`[비밀번호 재설정] ${email} → 인증코드: ${code}`);
    }
}
