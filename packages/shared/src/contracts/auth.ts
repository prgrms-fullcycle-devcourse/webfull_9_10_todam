import { z } from 'zod';

// 회원가입 요청 (POST /auth/signup). 약관 동의 필드는 BE SignupDto 미수용(forbidNonWhitelisted) → 미포함.
export const signupRequestSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    nickname: z.string().optional(),
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

// 회원가입 응답.
export const signupUserSchema = z.object({
    userId: z.string(),
    email: z.string(),
    nickname: z.string(),
});
export type SignupUser = z.infer<typeof signupUserSchema>;

export const signupResultSchema = z.object({
    user: signupUserSchema,
});
export type SignupResult = z.infer<typeof signupResultSchema>;

// 로그인 요청 (POST /auth/login). 소셜(oauth) 응답도 동일 result 스키마.
export const loginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// 로그인 응답.
export const loginUserSchema = z.object({
    userId: z.string(),
    email: z.string(),
    nickname: z.string(),
    isPartner: z.boolean(),
});
export type LoginUser = z.infer<typeof loginUserSchema>;

export const loginResponseSchema = z.object({
    accessToken: z.string(),
    user: loginUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
