import { z } from 'zod';

// ─── GET /policies/latest — 최신 약관 링크 조회 ───────────────────────────
// 출처: docs/exec-plans/active/약관 동의 조회.md "API Contract (스냅샷)"
// 인증: PUBLIC (가입 전 호출)
// 응답 필드: policyType / version / url / effectiveAt 4개만.
// Decision 3 확정(2026-06-11): isRequired 미포함 — 필수/선택은 FE config 유지.

export const policyVersionItemSchema = z.object({
    policyType: z.enum([
        'PRIVACY_POLICY',
        'TERMS_OF_SERVICE',
        'MARKETING',
        'LOCATION_BASED_SERVICE',
    ]),
    version: z.string(), // e.g. "v1.0"
    url: z.string().url(), // 노션 약관 링크
    effectiveAt: z.string().datetime(), // ISO 8601
});
export type PolicyVersionItem = z.infer<typeof policyVersionItemSchema>;

export const latestPoliciesResponseSchema = z.object({
    policies: z.array(policyVersionItemSchema),
});
export type LatestPoliciesResponse = z.infer<typeof latestPoliciesResponseSchema>;
