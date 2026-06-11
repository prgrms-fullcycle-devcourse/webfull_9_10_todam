// API Contract 바인딩: apps/api auth.controller `password/reset-request`, `password/reset`.
// BE는 email+code 링크 방식. 메일에 /reset-password?email=&code= 링크 발송(Redis TTL 30분).
// 엔드포인트/스키마/필드명은 contract 그대로. 임의 변경 금지.

import { clientApiFetch } from '@/shared/api';

// ───────────── POST /auth/password/reset-request ─────────────
// req: { email }
// res 200: data null (enumeration-proof — 미가입/소셜계정도 동일 200 반환)
// 메일로 /reset-password?email=&code= 재설정 링크 발송(Redis TTL 1800s=30분).
// err: 400 INVALID_EMAIL_FORMAT / 500 INTERNAL_SERVER_ERROR
export function requestPasswordReset(email: string): Promise<null> {
    return clientApiFetch<null>('/auth/password/reset-request', {
        method: 'POST',
        body: { email },
    });
}

// ───────────── POST /auth/password/reset ─────────────
// req: { email, code, newPassword }
// res 200: data null
// err: 400(코드 불일치/만료/미가입 또는 비밀번호 형식 오류) / 500
export function resetPassword(email: string, code: string, newPassword: string): Promise<null> {
    return clientApiFetch<null>('/auth/password/reset', {
        method: 'POST',
        body: { email, code, newPassword },
    });
}
