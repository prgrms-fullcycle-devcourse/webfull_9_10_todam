import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createApiEnv } from '@todam/config';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly env = createApiEnv();
    private readonly client = new SESClient({ region: this.env.SES_REGION });

    async sendVerificationCode(email: string, code: string): Promise<void> {
        await this.send(
            email,
            '[토담] 이메일 인증코드',
            this.codeEmailHtml(
                '이메일 인증',
                '아래 인증코드를 입력해 회원가입을 완료해주세요.',
                code,
            ),
            this.codeEmailText(
                '이메일 인증',
                '아래 인증코드를 입력해 회원가입을 완료해주세요.',
                code,
            ),
        );
    }

    async sendPasswordResetLink(email: string, code: string): Promise<void> {
        const resetUrl = `${this.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&code=${code}`;
        await this.send(
            email,
            '[토담] 비밀번호 재설정 링크',
            this.linkEmailHtml(
                '비밀번호 재설정',
                '아래 버튼을 클릭해 비밀번호를 재설정해주세요.',
                resetUrl,
                '비밀번호 재설정하기',
            ),
            this.linkEmailText(
                '비밀번호 재설정',
                '아래 버튼을 클릭해 비밀번호를 재설정해주세요.',
                resetUrl,
                '비밀번호 재설정하기',
            ),
        );
    }

    private async send(to: string, subject: string, html: string, text: string): Promise<void> {
        try {
            await this.client.send(
                new SendEmailCommand({
                    Source: this.env.SES_FROM_EMAIL,
                    Destination: { ToAddresses: [to] },
                    Message: {
                        Subject: { Data: subject, Charset: 'UTF-8' },
                        Body: {
                            Html: { Data: html, Charset: 'UTF-8' },
                            Text: { Data: text, Charset: 'UTF-8' },
                        },
                    },
                }),
            );
        } catch (error) {
            // 코드 값은 로그에 남기지 않음(민감 정보).
            this.logger.error(`SES 메일 발송 실패 (to=${to})`, error as Error);
            throw new InternalServerErrorException('EMAIL_SEND_FAILED');
        }
    }

    private codeEmailHtml(title: string, guide: string, code: string): string {
        return `<!DOCTYPE html>
<html lang="ko">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:'Apple SD Gothic Neo',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
      <h1 style="font-size:20px;color:#222;margin:0 0 16px;">토담 ${title}</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">${guide}</p>
      <div style="text-align:center;background:#f0f0f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#222;">${code}</span>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">인증코드는 5분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
    </div>
  </body>
</html>`;
    }

    private codeEmailText(title: string, guide: string, code: string): string {
        return `[토담 ${title}]\n\n${guide}\n\n인증코드: ${code}\n\n인증코드는 5분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해주세요.`;
    }

    private linkEmailHtml(title: string, guide: string, url: string, buttonLabel: string): string {
        return `<!DOCTYPE html>
<html lang="ko">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:'Apple SD Gothic Neo',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
      <h1 style="font-size:20px;color:#222;margin:0 0 16px;">토담 ${title}</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">${guide}</p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${url}" style="display:inline-block;background:#1D5628;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">${buttonLabel}</a>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">링크는 30분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
    </div>
  </body>
</html>`;
    }

    private linkEmailText(title: string, guide: string, url: string, buttonLabel: string): string {
        return `[토담 ${title}]\n\n${guide}\n\n${buttonLabel}: ${url}\n\n링크는 30분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해주세요.`;
    }
}
