'use client';

import { useQuery } from '@tanstack/react-query';

import type { PolicyVersionItem } from '@todam/shared';

import { getLatestPolicies } from './api';
import type { TermsKey } from './model/termsContent';

// BE policyType → FE TermsKey 매핑.
// MARKETING은 이 시트에 미노출이므로 매핑 제외.
const POLICY_TYPE_TO_TERMS_KEY: Partial<Record<PolicyVersionItem['policyType'], TermsKey>> = {
    TERMS_OF_SERVICE: 'service',
    PRIVACY_POLICY: 'privacy',
    LOCATION_BASED_SERVICE: 'location',
};

/** GET /policies/latest 응답을 TermsKey → url 매핑 형태로 변환한다. */
export function useLatestPolicies() {
    const query = useQuery({
        queryKey: ['policies', 'latest'],
        queryFn: getLatestPolicies,
        // 약관 URL은 자주 바뀌지 않으므로 5분간 fresh로 유지.
        staleTime: 5 * 60 * 1000,
    });

    // policyType → FE key → url 역인덱스 맵 빌드.
    const urlMap: Partial<Record<TermsKey, string>> = {};
    if (query.data) {
        for (const item of query.data.policies) {
            const key = POLICY_TYPE_TO_TERMS_KEY[item.policyType];
            if (key) urlMap[key] = item.url;
        }
    }

    return { ...query, urlMap };
}
