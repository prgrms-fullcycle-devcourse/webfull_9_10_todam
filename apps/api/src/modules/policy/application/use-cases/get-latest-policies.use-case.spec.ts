/// <reference types="jest" />
import { GetLatestPoliciesUseCase } from './get-latest-policies.use-case';

describe('GetLatestPoliciesUseCase', () => {
    const findAllLatest = jest.fn();
    const repo = { findAllLatest };
    const useCase = new GetLatestPoliciesUseCase(repo as never);

    const EFFECTIVE_AT = new Date('2026-01-01T00:00:00.000Z');

    const makeRow = (policyType: string) => ({
        policyType,
        version: 'v1.0',
        url: `https://notion.so/todam/${policyType.toLowerCase()}-placeholder`,
        effectiveAt: EFFECTIVE_AT,
    });

    beforeEach(() => {
        findAllLatest.mockReset();
    });

    it('isLatest=true 인 row 만 반환한다 (repository 위임 확인)', async () => {
        const rows = [
            makeRow('TERMS_OF_SERVICE'),
            makeRow('PRIVACY_POLICY'),
            makeRow('LOCATION_BASED_SERVICE'),
        ];
        findAllLatest.mockResolvedValue(rows);

        const result = await useCase.execute();

        expect(findAllLatest).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3);
    });

    it('빈 배열 — 시드 없을 때 빈 배열 반환 (404 아님)', async () => {
        findAllLatest.mockResolvedValue([]);

        const result = await useCase.execute();

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });

    it('정렬: TERMS_OF_SERVICE → PRIVACY_POLICY → LOCATION_BASED_SERVICE → MARKETING', async () => {
        // 역순으로 넣어도 정렬 후 올바른 순서여야 한다.
        const rows = [
            makeRow('MARKETING'),
            makeRow('LOCATION_BASED_SERVICE'),
            makeRow('PRIVACY_POLICY'),
            makeRow('TERMS_OF_SERVICE'),
        ];
        findAllLatest.mockResolvedValue(rows);

        const result = await useCase.execute();

        expect(result[0]?.policyType).toBe('TERMS_OF_SERVICE');
        expect(result[1]?.policyType).toBe('PRIVACY_POLICY');
        expect(result[2]?.policyType).toBe('LOCATION_BASED_SERVICE');
        expect(result[3]?.policyType).toBe('MARKETING');
    });

    it('알 수 없는 policyType 은 정렬 마지막(order=99)에 위치한다', async () => {
        const rows = [makeRow('UNKNOWN_TYPE'), makeRow('TERMS_OF_SERVICE')];
        findAllLatest.mockResolvedValue(rows);

        const result = await useCase.execute();

        expect(result[0]?.policyType).toBe('TERMS_OF_SERVICE');
        expect(result[1]?.policyType).toBe('UNKNOWN_TYPE');
    });

    it('정렬은 원본 배열을 변경하지 않는다 (slice 사용)', async () => {
        const rows = [makeRow('MARKETING'), makeRow('TERMS_OF_SERVICE')];
        findAllLatest.mockResolvedValue(rows);

        const result = await useCase.execute();

        // 원본 rows는 변경되지 않음
        expect(rows[0]?.policyType).toBe('MARKETING');
        // 결과는 정렬됨
        expect(result[0]?.policyType).toBe('TERMS_OF_SERVICE');
    });
});
