import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import type { LatestPoliciesResponse } from '@todam/shared';

import { useLatestPolicies } from './queries';
import { getLatestPolicies } from './api';

// 실제 네트워크 대신 api 모듈만 모킹 — 매핑 로직 자체에 집중.
jest.mock('./api', () => ({
    getLatestPolicies: jest.fn(),
}));

const mockGetLatestPolicies = getLatestPolicies as jest.MockedFunction<typeof getLatestPolicies>;

function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

function policy(policyType: string, url: string) {
    return { policyType, url } as LatestPoliciesResponse['policies'][number];
}

describe('useLatestPolicies', () => {
    it('policyType을 FE TermsKey → url 맵으로 변환한다', async () => {
        mockGetLatestPolicies.mockResolvedValue({
            policies: [
                policy('TERMS_OF_SERVICE', 'https://t.example/service'),
                policy('PRIVACY_POLICY', 'https://t.example/privacy'),
                policy('LOCATION_BASED_SERVICE', 'https://t.example/location'),
            ],
        } as LatestPoliciesResponse);

        const { result } = renderHook(() => useLatestPolicies(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.urlMap).toEqual({
            service: 'https://t.example/service',
            privacy: 'https://t.example/privacy',
            location: 'https://t.example/location',
        });
    });

    it('시트에 미노출인 MARKETING 약관은 urlMap에서 제외한다', async () => {
        mockGetLatestPolicies.mockResolvedValue({
            policies: [
                policy('TERMS_OF_SERVICE', 'https://t.example/service'),
                policy('MARKETING', 'https://t.example/marketing'),
            ],
        } as LatestPoliciesResponse);

        const { result } = renderHook(() => useLatestPolicies(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.urlMap).toEqual({ service: 'https://t.example/service' });
        expect(result.current.urlMap).not.toHaveProperty('marketing');
    });

    it('빈 정책 배열이면 urlMap은 빈 객체다(시드 없음)', async () => {
        mockGetLatestPolicies.mockResolvedValue({ policies: [] } as LatestPoliciesResponse);

        const { result } = renderHook(() => useLatestPolicies(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.urlMap).toEqual({});
    });

    it('로딩 중(데이터 없음)에는 urlMap이 빈 객체다', () => {
        mockGetLatestPolicies.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useLatestPolicies(), { wrapper: makeWrapper() });

        expect(result.current.urlMap).toEqual({});
    });
});
