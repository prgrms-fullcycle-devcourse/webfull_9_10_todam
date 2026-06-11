import { NtsService, NtsApiError } from './nts.service';

// NtsService는 createApiEnv()를 생성자에서 직접 호출하므로
// 환경변수 모킹이 필요하다.
jest.mock('@todam/config', () => ({
    createApiEnv: jest.fn(() => ({ NTS_API_KEY: 'test-api-key' })),
}));

// Node global fetch를 mock
global.fetch = jest.fn();

describe('NtsService', () => {
    let service: NtsService;
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        service = new NtsService();
        mockFetch.mockReset();
    });

    describe('validate()', () => {
        it('HTTP 200, valid=01, b_stt 포함 → 정상 파싱', async () => {
            const rawBody = {
                status_code: '200',
                data: [
                    {
                        b_no: '1234567890',
                        valid: '01',
                        b_stt: '계속사업자',
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => rawBody,
            } as Response);

            const res = await service.validate('1234567890', '홍길동', '20190315');

            expect(res.data[0]!.valid).toBe('01');
            expect(res.data[0]!.b_stt).toBe('계속사업자');
            expect(res._raw).toEqual(rawBody);
        });

        it('HTTP 200, valid=02 → MISMATCH 의미 응답 정상 반환', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status_code: '200',
                    data: [{ b_no: '1234567890', valid: '02' }],
                }),
            } as Response);

            const res = await service.validate('1234567890', '홍길동', '20190315');

            expect(res.data[0]!.valid).toBe('02');
        });

        it('HTTP 200, b_stt 없음 → data[0].b_stt = undefined', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status_code: '200',
                    data: [{ b_no: '1234567890', valid: '01' }],
                }),
            } as Response);

            const res = await service.validate('1234567890', '홍길동', '20190315');

            expect(res.data[0]!.b_stt).toBeUndefined();
        });

        it('HTTP 4xx → NtsApiError throw', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => 'Unauthorized',
            } as Response);

            await expect(service.validate('1234567890', '홍길동', '20190315')).rejects.toThrow(
                NtsApiError,
            );
        });

        it('AbortError(타임아웃) → NtsApiError throw', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            mockFetch.mockRejectedValueOnce(abortError);

            await expect(service.validate('1234567890', '홍길동', '20190315')).rejects.toThrow(
                NtsApiError,
            );
        });

        it('네트워크 오류(TypeError) → NtsApiError throw', async () => {
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

            await expect(service.validate('1234567890', '홍길동', '20190315')).rejects.toThrow(
                NtsApiError,
            );
        });

        it('HTTP 200이지만 본문이 JSON null → NtsApiError throw (TypeError 방지)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => null,
            } as Response);

            await expect(service.validate('1234567890', '홍길동', '20190315')).rejects.toThrow(
                NtsApiError,
            );
        });

        it('HTTP 200이지만 data가 배열이 아니면 빈 배열로 안전 처리', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status_code: '200', data: { unexpected: true } }),
            } as Response);

            const res = await service.validate('1234567890', '홍길동', '20190315');

            expect(res.data).toEqual([]);
        });
    });

    describe('getStatus()', () => {
        it('HTTP 200 → 상태 정상 파싱', async () => {
            const rawBody = {
                status_code: '200',
                data: [
                    {
                        b_no: '1234567890',
                        b_stt: '계속사업자',
                        b_stt_cd: '01',
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => rawBody,
            } as Response);

            const res = await service.getStatus('1234567890');

            expect(res.data[0]!.b_stt).toBe('계속사업자');
        });

        it('HTTP 5xx → NtsApiError throw', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            } as Response);

            await expect(service.getStatus('1234567890')).rejects.toThrow(NtsApiError);
        });
    });

    describe('API 키 없음', () => {
        it('NTS_API_KEY 미설정 시 → NtsApiError throw', async () => {
            const { createApiEnv } = jest.requireMock('@todam/config') as {
                createApiEnv: jest.Mock;
            };
            createApiEnv.mockReturnValueOnce({ NTS_API_KEY: undefined });

            const serviceNoKey = new NtsService();

            await expect(serviceNoKey.validate('1234567890', '홍길동', '20190315')).rejects.toThrow(
                NtsApiError,
            );
        });
    });
});
