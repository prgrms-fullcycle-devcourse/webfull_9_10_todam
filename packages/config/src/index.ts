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
    S3_BUCKET_NAME: z.string(),
    S3_REGION: z.string().default('ap-northeast-2'),
    CORS_ORIGINS: z
        .string()
        .default('http://localhost:3000,https://todam.app,https://www.todam.app'),
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
