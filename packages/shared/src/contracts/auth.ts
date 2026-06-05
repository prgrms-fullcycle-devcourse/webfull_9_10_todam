import { z } from 'zod';

// 공통 필드 정책. 요청 스키마는 .strict() — 미허용 필드 거부(BE forbidNonWhitelisted 대응).
const emailSchema = z
    .string()
    .email('유효한 이메일을 입력해주세요.')
    .meta({ example: 'user@example.com' });
const passwordSchema = z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(100)
    .meta({ example: 'password1234' });
const verificationCodeSchema = z
    .string()
    .length(6, '인증코드는 6자리입니다.')
    .meta({ example: '482917' });

// ───────────── 회원가입 (POST /auth/signup) ─────────────
// 약관 동의 필드는 스키마 미수용(.strict) → 전송 시 거부. 동의 시트 확정 전까지 미전송.
export const signupRequestSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
        nickname: z
            .string()
            .min(2, '닉네임은 2자 이상이어야 합니다.')
            .max(100)
            .meta({
                example: '도예인',
                description: '미입력 시 랜덤 닉네임 자동 생성',
            })
            .optional(),
    })
    .strict();
export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const signupUserSchema = z.object({
    userId: z.string().meta({ example: 'user-uuid-001' }),
    email: z.string().meta({ example: 'user@example.com' }),
    nickname: z.string().meta({ example: '도예인' }),
});
export type SignupUser = z.infer<typeof signupUserSchema>;

export const signupResponseSchema = z.object({
    user: signupUserSchema,
});
export type SignupResponse = z.infer<typeof signupResponseSchema>;

// ───────────── 로그인 (POST /auth/login) ─────────────
export const loginRequestSchema = z
    .object({
        email: emailSchema,
        password: z.string().meta({ example: 'password1234' }),
    })
    .strict();
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginUserSchema = z.object({
    userId: z.string().meta({ example: 'user-uuid-001' }),
    email: z.string().meta({ example: 'user@example.com' }),
    nickname: z.string().meta({ example: '도예인' }),
    isPartner: z.boolean().meta({ example: false }),
});
export type LoginUser = z.infer<typeof loginUserSchema>;

export const loginResponseSchema = z.object({
    accessToken: z.string().meta({ example: 'jwt-access-token' }),
    user: loginUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// ───────────── 소셜 로그인 (POST /auth/oauth/{kakao,google}) ─────────────
// 인가코드 요청 → 응답은 로그인 응답과 동일 스키마.
export const oauthCodeRequestSchema = z
    .object({
        code: z.string().meta({
            example: 'oauth-authorization-code',
            description: '프론트에서 OAuth 제공자로부터 받은 인가 코드',
        }),
    })
    .strict();
export type OAuthCodeRequest = z.infer<typeof oauthCodeRequestSchema>;

export const oauthResponseSchema = loginResponseSchema;
export type OAuthResponse = LoginResponse;

// ───────────── 이메일 인증코드 발송 (POST /auth/email/send-code) ─────────────
export const sendCodeRequestSchema = z.object({ email: emailSchema }).strict();
export type SendCodeRequest = z.infer<typeof sendCodeRequestSchema>;

// ───────────── 이메일 인증코드 확인 (POST /auth/email/verify-code) ─────────────
export const verifyCodeRequestSchema = z
    .object({ email: emailSchema, code: verificationCodeSchema })
    .strict();
export type VerifyCodeRequest = z.infer<typeof verifyCodeRequestSchema>;

// ───────────── 비밀번호 재설정 메일 요청 (POST /auth/password/reset-request) ─────────────
export const passwordResetRequestSchema = z.object({ email: emailSchema }).strict();
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

// ───────────── 비밀번호 재설정 (POST /auth/password/reset) ─────────────
export const passwordResetSchema = z
    .object({
        email: emailSchema,
        code: z.string().meta({ description: '이메일로 받은 6자리 인증코드' }),
        newPassword: passwordSchema.meta({ example: 'newpassword1234' }),
    })
    .strict();
export type PasswordReset = z.infer<typeof passwordResetSchema>;

// ───────────── 토큰 재발급 응답 (POST /auth/refresh) ─────────────
export const accessTokenResponseSchema = z.object({
    accessToken: z.string().meta({ example: 'jwt-access-token' }),
});
export type AccessTokenResponse = z.infer<typeof accessTokenResponseSchema>;
