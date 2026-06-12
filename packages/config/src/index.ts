import { z } from 'zod';

// 기존 코드 유지
export type RuntimeEnvironment = 'local' | 'dev' | 'prod';

export const DEFAULT_API_PORT = 4000;
export const DEFAULT_WEB_PORT = 3000;
export const DEFAULT_ADMIN_PORT = 3001;

// ─── API 환경변수 스키마 ───────────────────────────────────
const apiSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default(String(DEFAULT_API_PORT)),
    DATABASE_URL: z.string(),
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    JWT_ADMIN_SECRET: z.string(),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    S3_BUCKET_NAME: z.string(),
    S3_REGION: z.string().default('ap-northeast-2'),
    SES_REGION: z.string().default('ap-northeast-2'),
    SES_FROM_EMAIL: z.string(),
    CORS_ORIGINS: z
        .string()
        .default('http://localhost:3000,https://todam.app,https://www.todam.app'),
    KAKAO_CLIENT_ID: z.string(),
    KAKAO_CLIENT_SECRET: z.string(),
    KAKAO_REDIRECT_URI: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string(),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    // 사업자등록증 OCR(Google Vision) / 진위확인(국세청). 기능 미배포 단계라 optional.
    // OCR·verify 서비스 구현 시 사용 지점에서 존재 검증(없으면 503)하고, 그때 required로 좁힌다.
    GOOGLE_VISION_CLIENT_EMAIL: z.string().email().optional(),
    GOOGLE_VISION_PRIVATE_KEY: z.string().optional(),
    NTS_API_KEY: z.string().optional(),
});

// ─── Web 환경변수 스키마 ──────────────────────────────────
const webSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    NEXT_PUBLIC_API_URL: z.string(),
});

// ─── Admin 환경변수 스키마 ────────────────────────────────
const adminSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    NEXT_PUBLIC_API_URL: z.string(),
});

// ─── 헬퍼 함수 ───────────────────────────────────────────
const parseEnv = <T extends z.ZodTypeAny>(schema: T) => {
    const parsed = schema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ 환경변수가 올바르지 않아요:');
        console.error(parsed.error.flatten().fieldErrors);
        process.exit(1);
    }

    return parsed.data as z.infer<T>;
};

export const createApiEnv = () => parseEnv(apiSchema);
export const createWebEnv = () => parseEnv(webSchema);
export const createAdminEnv = () => parseEnv(adminSchema);

// ─── 타입 export ──────────────────────────────────────────
export type ApiEnv = z.infer<typeof apiSchema>;
export type WebEnv = z.infer<typeof webSchema>;
export type AdminEnv = z.infer<typeof adminSchema>;
