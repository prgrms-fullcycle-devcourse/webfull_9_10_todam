import { apiFetch } from '@/shared/api';

export interface SignupUser {
    userId: string;
    email: string;
    nickname: string;
}

export interface SignupResult {
    user: SignupUser;
}

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

// 약관 동의 필드는 SignupDto(BE)에 없음 + forbidNonWhitelisted → 전송 시 400. 동의 시트 확정 전까지 미전송.
export function signup(input: { email: string; password: string; nickname?: string }) {
    return apiFetch<SignupResult>('/auth/signup', {
        method: 'POST',
        body: input,
    });
}
