// API Contract 바인딩: docs/exec-plans/active/login.md ## API Contract (스냅샷)
// 엔드포인트/스키마/필드명은 contract 그대로. 임의 변경 금지.

import type { LoginRequest, LoginResponse } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// 응답/요청 타입 = @todam/shared contract(SSOT). 소비자 호환 위해 re-export.
export type { LoginResponse, LoginUser } from '@todam/shared';
export type EmailLoginInput = LoginRequest;

// ---------- 이메일 로그인 ----------
// POST /auth/login
// req:  { email, password }
// res 200: { data: { accessToken, user } }
// err:  400 INVALID_REQUEST / 401 UNAUTHORIZED / 403 EMAIL_UNVERIFIED / 500 INTERNAL_SERVER_ERROR

export function emailLogin(input: EmailLoginInput): Promise<LoginResponse> {
    return clientApiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
        credentials: 'include', // Refresh Token HttpOnly Cookie 수신
    });
}

// ---------- 카카오 소셜 로그인 ----------
// POST /auth/oauth/kakao
// req:  { code: string }   — 카카오 인가코드
// res 200: data 스키마 동일
// err:  400 INVALID_REQUEST / 500 EXTERNAL_AUTH_SERVER_ERROR

export function kakaoLogin(code: string): Promise<LoginResponse> {
    return clientApiFetch<LoginResponse>('/auth/oauth/kakao', {
        method: 'POST',
        body: { code },
        credentials: 'include',
    });
}

// ---------- 구글 소셜 로그인 ----------
// POST /auth/oauth/google
// req:  { code: string }   — 구글 인가코드
// res 200: data 스키마 동일
// err:  400 INVALID_REQUEST / 403 GOOGLE_EMAIL_UNVERIFIED / 500 EXTERNAL_AUTH_SERVER_ERROR

export function googleLogin(code: string): Promise<LoginResponse> {
    return clientApiFetch<LoginResponse>('/auth/oauth/google', {
        method: 'POST',
        body: { code },
        credentials: 'include',
    });
}
