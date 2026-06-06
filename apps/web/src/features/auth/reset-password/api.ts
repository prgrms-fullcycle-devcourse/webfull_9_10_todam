// API Contract 바인딩: docs/exec-plans/active/인증 - 비밀번호 재설정.md ## API Contract (스냅샷)
// 엔드포인트/스키마/필드명은 contract 그대로. 임의 변경 금지.

import { clientApiFetch } from '@/shared/api';

// ───────────── POST /auth/password/reset-request ─────────────
// req: { email }
// res 200: data null (enumeration-proof — 미가입 이메일도 동일 200 반환)
// err: 400 INVALID_EMAIL_FORMAT / 500 INTERNAL_SERVER_ERROR
export function requestPasswordReset(email: string): Promise<null> {
    return clientApiFetch<null>('/auth/password/reset-request', {
        method: 'POST',
        body: { email },
    });
}

// ───────────── POST /auth/password/reset ─────────────
// req: { token, newPassword }
// res 200: data null
// err: 400 INVALID_PASSWORD_FORMAT / 400 PASSWORD_ALREADY_USED / 401 INVALID_OR_EXPIRED_TOKEN / 500
export function resetPassword(token: string, newPassword: string): Promise<null> {
    return clientApiFetch<null>('/auth/password/reset', {
        method: 'POST',
        body: { token, newPassword },
    });
}
