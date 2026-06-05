import type { SignupRequest, SignupResponse } from '@todam/shared';

import { apiFetch } from '@/shared/api';

export function sendEmailCode(email: string) {
    return apiFetch<void>('/auth/email/send-code', {
        method: 'POST',
        body: { email },
    });
}

export function verifyEmailCode(email: string, code: string) {
    return apiFetch<void>('/auth/email/verify-code', {
        method: 'POST',
        body: { email, code },
    });
}

// 약관 동의 필드는 signupRequestSchema(shared, .strict)에 없음 → 전송 시 거부. 동의 시트 확정 전까지 미전송.
export function signup(input: SignupRequest) {
    return apiFetch<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: input,
    });
}
