import type { LatestPoliciesResponse } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

/** GET /policies/latest — 최신 약관 링크 조회 (PUBLIC, 인증 불필요). */
export function getLatestPolicies(): Promise<LatestPoliciesResponse> {
    return clientApiFetch<LatestPoliciesResponse>('/policies/latest');
}
