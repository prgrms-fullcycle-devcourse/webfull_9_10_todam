import type { SignupRequest } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

import { sendEmailCode, verifyEmailCode, signup } from './api';

// 실제 fetch 대신 공용 클라이언트만 모킹 — 각 함수가 올바른 엔드포인트/메서드/바디를
// 호출하는지(=BE와의 계약)를 검증한다.
jest.mock('@/shared/api', () => ({
    clientApiFetch: jest.fn(),
}));

const mockFetch = clientApiFetch as jest.MockedFunction<typeof clientApiFetch>;

describe('signup feature api', () => {
    beforeEach(() => {
        mockFetch.mockResolvedValue(undefined as never);
    });

    it('sendEmailCode → POST /auth/email/send-code { email }', async () => {
        await sendEmailCode('user@todam.app');
        expect(mockFetch).toHaveBeenCalledWith('/auth/email/send-code', {
            method: 'POST',
            body: { email: 'user@todam.app' },
        });
    });

    it('verifyEmailCode → POST /auth/email/verify-code { email, code }', async () => {
        await verifyEmailCode('user@todam.app', '123456');
        expect(mockFetch).toHaveBeenCalledWith('/auth/email/verify-code', {
            method: 'POST',
            body: { email: 'user@todam.app', code: '123456' },
        });
    });

    it('signup → POST /auth/signup 으로 약관 3종 동의값을 그대로 전송한다', async () => {
        const input: SignupRequest = {
            email: 'user@todam.app',
            password: 'Password123!',
            nickname: '도담이',
            termsAgreed: true,
            privacyAgreed: true,
            locationAgreed: true,
        };

        await signup(input);

        expect(mockFetch).toHaveBeenCalledWith('/auth/signup', {
            method: 'POST',
            body: input,
        });
    });
});
