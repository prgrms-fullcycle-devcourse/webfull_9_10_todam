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
