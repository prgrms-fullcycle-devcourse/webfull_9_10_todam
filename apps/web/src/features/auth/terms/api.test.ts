import { clientApiFetch } from '@/shared/api';

import { getLatestPolicies } from './api';

jest.mock('@/shared/api', () => ({
    clientApiFetch: jest.fn(),
}));

const mockFetch = clientApiFetch as jest.MockedFunction<typeof clientApiFetch>;

describe('terms feature api', () => {
    it('getLatestPolicies → GET /policies/latest (인증 불필요·기본 메서드)', async () => {
        mockFetch.mockResolvedValue({ policies: [] } as never);

        await getLatestPolicies();

        expect(mockFetch).toHaveBeenCalledWith('/policies/latest');
    });

    it('응답을 그대로 반환한다', async () => {
        const response = { policies: [] };
        mockFetch.mockResolvedValue(response as never);

        await expect(getLatestPolicies()).resolves.toBe(response);
    });
});
