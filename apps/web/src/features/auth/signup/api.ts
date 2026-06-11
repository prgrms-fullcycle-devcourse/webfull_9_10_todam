import type { SignupRequest, SignupResponse } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

export function sendEmailCode(email: string) {
    return clientApiFetch<void>('/auth/email/send-code', {
        method: 'POST',
        body: { email },
    });
}

export function verifyEmailCode(email: string, code: string) {
    return clientApiFetch<void>('/auth/email/verify-code', {
        method: 'POST',
        body: { email, code },
    });
}

export function signup(input: SignupRequest) {
    return clientApiFetch<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: input,
    });
}
